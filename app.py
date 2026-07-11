import os
import asyncio
import json
import scipy.stats as stats
from helpers import *
from flask import Flask, render_template,request,redirect,url_for,session,flash,jsonify
from authlib.integrations.flask_client import OAuth
from jikanpy import AioJikan

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_KEY")
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True 

# For Google Auth (The implemnation was learnt from youtube tutorials)
oauth= OAuth(app)
google = oauth.register(
    name='google',
    client_id = os.environ.get("CLIENT_ID"),
    client_secret = os.environ.get("CLIENT_SECRET"),
    server_metadata_url = 'https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs = {'scope':'openid profile email'}
)
def dict_factory(cursor, row):
    # This automatically maps the column names from the database 
    # to the values, behaving exactly like sqlite3.Row
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


@app.route("/")
@login_required
def home():
    try:
        user_id = session['user_id']
        
        # Get the info on the user, lists created, and comments made 
        userdata = query_db(
            "SELECT username, userimg FROM users WHERE id = ?", 
            (user_id,), 
            one=True
        )
        
        listsdata = query_db(
            "SELECT lists.id AS id, title, category, AVG(similarity_score) AS list_rating, COUNT(submissions.id) AS subs FROM lists LEFT JOIN submissions ON lists.id=list_id WHERE user_id = ? GROUP BY lists.id", 
            (user_id,)
        )
        
        total_list = query_db(
            "SELECT COUNT(*) AS total FROM lists WHERE user_id = ?", 
            (user_id,), 
            one=True
        )
        
        subsdata = query_db(
            "SELECT COUNT(*) AS subs, AVG(similarity_score) AS rating FROM submissions WHERE list_id IN (SELECT id FROM lists WHERE user_id = ?)", 
            (user_id,), 
            one=True
        )
        
    except Exception as e:
        # Swapped sqlite3.Error for a general Exception to catch any Turso/libsql issues
        return render_template("error.html", text=f"Error: {str(e)}")

    return render_template("index.html", userdata=userdata, listsdata=listsdata, totallist=total_list, subsdata=subsdata)

# The login/landing page
@app.route("/login",methods=["GET","POST"])
def login():
    if request.method == "GET":
        #if user is logged in, dont open this page
        if session.get("user_id"):
            return redirect("/")
        #if GET request, then open the page
        return render_template("login.html")
    else:
        # if POST request, then log in and redirect to the dashboard
        try:
            redirecturl = url_for("authorize",_external=True)
            return google.authorize_redirect(redirecturl,prompt='select_account')
        except Exception as e:
            app.logger.error(f"Error during login:{str(e)}")
            return render_template("error.html",text="Error occurred during login")

# Route for authorization
@app.route("/authorize")
def authorize():
    token = google.authorize_access_token()
    userinfo_endpoint = google.server_metadata['userinfo_endpoint']
    resp = google.get(userinfo_endpoint)
    # Take the response from google 
    userinfo = resp.json()
    uniquemail = userinfo['email']
    username = userinfo['name']
    userimg = userinfo['picture']

    try:
        #Check if user exists or not
        user = query_db("SELECT * FROM users WHERE uniquemail=?",(uniquemail,),one=True)
        # if the user doesn't exist, add him
        if user is None:
            modify_db("INSERT INTO users (uniquemail,username,userimg) VALUES (?,?,?)",(uniquemail,username,userimg,))
        # Get the users id now
        user_id = query_db("SELECT id FROM users WHERE uniquemail=?",(uniquemail,),one=True)
    except Exception as e:
        return render_template("error.html",text=f"Error:{str(e)}")

    user_id= user_id['id']
    
    session['user_id'] = user_id
    session['oauth_token'] = token

    return redirect("/")


# Route to logout the user
@app.route("/logout")
@login_required
def logout():
    session.clear()
    return redirect("/login")


# The search code was written with help from JIkan API docs and Gemini
# To search the users requested anime,characters or manga
@app.route("/search",methods=["POST"])
async def search():
    # Get the data 
    dataget = request.get_json()
    query = dataget.get("query","").lower()
    search = dataget.get("template","")
    # If data was not given 
    if query is None or search is None:
        return jsonify("error no search term provided"),400
    # if data is given search it , format it , return it as a json file
    try:
        async with AioJikan() as aio_jikan:
            sorting_parameters = {'order_by':'popularity','sort':'asc','limit':20}
            if search == 'characters':
                sorting_parameters["order_by"] = "favorites"
                sorting_parameters["sort"] = "desc"
            result = await aio_jikan.search(search_type = search, query= query, parameters=sorting_parameters)
            formatted_results = []
            for data in result.get('data',[]):
                if search == 'anime' or search == 'manga':
                    formatted_results.append ({
                    'mal_id': data.get("mal_id"),
                    'title': data.get("title"),
                    'image': data["images"]["jpg"]["image_url"]
                    })
                else:
                    formatted_results.append({
                    'mal_id': data.get("mal_id"),
                    'name': data.get("name"),
                    'image': data["images"]["jpg"]["image_url"]
                    })   
        return jsonify(formatted_results)
    except Exception as e:
        # in case of any errors
        return jsonify({"error":"failed to fetch data", "problem" : str(e)}),500

#To change the users name 
@app.route("/changename",methods=["POST"])
@login_required
def changename():
    newname= request.form.get('username')
    try:
        # Update the username and give the user a confirmation 
        modify_db('UPDATE users SET username = ? WHERE id = ?',(newname,session['user_id'],))
        flash("Name succesfully changed!","success")
    except:
        # tell the user an error occurred
        flash("Sorry some error occured","danger")
    return redirect("/")

# To create a Tierlist
@app.route("/createlist",methods=["POST","GET"])
@login_required
def create_list():

    if request.method == "GET":
        # If through GET request, open the page
        category = request.args.get("option")
        if category not in ["characters","anime","manga"]:
            flash("Some error occured", "danger")
            return redirect("/")
        return render_template("createlist.html",category = category)
    else:
        # if a POST request is made, add the tierlist to the data base 

        # JSON string is converted to a dict 
        tierdata = request.get_json()
        conn = get_db_connection()
        try:
            # Get all this info from the tierdata
            title = tierdata.get("title")
            desc = tierdata.get("description","")
            category = tierdata.get("category")
            
            # Remove the info we already got, now only tierlist info remains
            tierdata.pop("title",None)
            tierdata.pop("description",None)
            tierdata.pop("category",None)
            # Make the rest of the data a JSON string
            tierdata = json.dumps(tierdata)

            modify_db("INSERT INTO lists (title,description,jsonlist,user_id,category) VALUES (?,?,?,?,?)",(title,desc,tierdata,session['user_id'],category,))
        except Exception as e:
            conn.close()
            return render_template("error.html",text=f"Some error occured: {str(e)}")
        return redirect(url_for('home'))

# View the tierlist uploaded
@app.route("/view")
def view_list():
    # Get the data id FROM GET request
    list_id = request.args.get("list")
    try:
        # Get a bunch of data about the author, the list and the comments
        listdata = query_db("SELECT id,title,description,category,user_id FROM lists where id = ?",(list_id,),one=True)
        userdata = query_db("SELECT username,userimg FROM users where id = ?",(listdata['user_id'],),one=True)
        tierlist = query_db("SELECT jsonlist FROM lists where id = ?",(list_id,),one=True)
        commentdata = query_db("SELECT * FROM submissions WHERE list_id=?",(list_id,))
        listinfo = query_db("SELECT COUNT(*) AS subs,AVG(similarity_score) AS rating FROM submissions WHERE list_id=?",(list_id,),one=True)
    except Exception as e:
        return render_template("error.html",text=f"Error: {str(e)}")
    
    #Make the JSON a dict  
    tierlist = json.loads(tierlist['jsonlist'])
    
    return render_template("viewlist.html",userdata=userdata,listdata=listdata,tierlist=tierlist,commentdata=commentdata,listinfo=listinfo)

# Create the comments/submissions
@app.route("/createsubs",methods={"GET","POST"})
def create_submission():
    if request.method == "GET":
        # if GET open the html page
        list_id = request.args.get("list_id")

        try:
            # Get the orignal list to show those elements only in the create subs page
            list_elements = query_db("SELECT jsonlist FROM lists where id = ?",(list_id,),one=True)
        except Exception as e:
            return render_template("error.html",text=f"Error: {str(e)}")
        if list_elements is None:
            return render_template("error.html",text=f"Error: This list doesn't exist.")
        list_elements = json.loads(list_elements['jsonlist'])
        return render_template("createsubs.html",list_id=list_id,list_elements=list_elements)
    else:
        # In POST request, get the sub data entered 
        tierdata = request.get_json()
        # Get the commenters name and the list they commented on 
        username = tierdata.get("username")
        list_id = tierdata.get("list_id")
        # Pop the info we got, now only the actual tierlist data is in tierdata
        tierdata.pop("list_id",None)
        tierdata.pop("username",None)
        # Calculate the similairty score
        similarity_score = score_generate(tierdata,list_id)

        tierdata = json.dumps(tierdata)

        conn = get_db_connection()
        try:
            # Insert the data and also get the id at which its inserted back.
            modify_db("INSERT INTO submissions (username,list_id,jsonsubmission,similarity_score) VALUES (?,?,?,?)",(username,list_id,tierdata,similarity_score,))
            sub_id = query_db("SELECT id FROM submissions WHERE username = ? AND list_id=? AND jsonsubmission=? AND similarity_score=?",(username,list_id,tierdata,similarity_score,),one=True)
        except Exception as e:
            return render_template("error.html",text=f"Error: {str(e)}")
        
        session['sub_id'] = sub_id['id']
        return redirect(url_for('view_result'))

# Viewing the result after the submission is submitted
@app.route("/viewresult",methods=["GET","POST"])
def view_result():
    if request.method == "GET":
        # IN GET REQUEST, SHOW THE PAGE WITH THE SCORE, LET THEM COMMENT, ALSO SHOW A SIDE TO SIDE BY COMPARISON
        sub_id = session.get('sub_id',None)
        try:
            # GET the data about the the submission submitted rn
            sub_data = query_db("SELECT username,list_id,jsonsubmission,similarity_score FROM submissions WHERE id =?",(sub_id,),one=True)
            list_id = sub_data['list_id']
            list_data =  query_db("SELECT id,jsonlist FROM lists WHERE id =?",(list_id,),one=True)
        except Exception as e:
            print(sub_id)
            return render_template("error.html",text=f"Error: {str(e)}")
        
        # Send everything neatly.
        sub_tier = json.loads(sub_data['jsonsubmission'])
        list_tier = json.loads(list_data['jsonlist'])

        return render_template("results.html",sub_tier= sub_tier,list_tier=list_tier,sub_id=sub_id,sub_data=sub_data,list_id=list_id)
    else:
        # To add a comment 
        session.pop('sub_id',None)
        comment = request.form.get("commentbox")
        sub_id = request.form.get("sub_id")
        try:
            modify_db("UPDATE submissions SET comment = ? WHERE id =?",(comment,sub_id,))
            list_id = query_db("SELECT list_id FROM submissions WHERE id = ?",(sub_id,),one=True)
        except Exception as e:
            return render_template("error.html",text=f"Error: {str(e)}")
        
        list_id=list_id['list_id']
       
        return redirect(url_for('view_list',list=list_id))

# View the result page from any other comment
@app.route('/viewcomment')
def view_comment():
    sub_id = request.args.get('sub')
    try:
        sub_data = query_db("SELECT username,similarity_score,jsonsubmission,comment,list_id FROM submissions WHERE id = ?",(sub_id,),one=True)
        listdata = query_db("SELECT id,jsonlist FROM lists WHERE id=?",(sub_data['list_id'],),one=True)
        sub_tier = json.loads(sub_data['jsonsubmission'])
        list_tier = json.loads(listdata['jsonlist'])
    except Exception as e:
        return render_template("error.html",text=f"Error: {str(e)}")
    
    return  render_template("results.html",sub_tier=sub_tier,list_tier=list_tier,sub_data=sub_data,list_id = listdata['id'])

# From the idct of tierlist to a list that can be used in the tau function
def dict_to_taulist(dictionary):
    id_list = []
    for tier in ['S','A','B','C','D']:
        for item in dictionary[tier]:
            id_list.append(item['mal_id'])
    id_list.sort()
    return_list = []
    mapping_list= {'S':50,'A':40,'B':30,'C':20,'D':10}
    for mal_id in id_list:
        for tier in ['S','A','B','C','D']:
            for item in dictionary[tier]:
                if mal_id == item['mal_id']:
                    return_list.append(mapping_list[tier])
    return return_list

# Genrate the similarity score by comparing
def score_generate(subs_dict,list_id):
    try:
        main_list = query_db("SELECT jsonlist FROM lists WHERE id=?",(list_id,),one=True)
        main_list = json.loads(main_list['jsonlist'])
    except Exception as e:
        return render_template("error.html",text=f"Error: {str(e)}")
    
    # convert the data into the usable list
    main_list = dict_to_taulist(main_list)
    subs_list = dict_to_taulist(subs_dict)
    
    tau, p_value = stats.kendalltau(main_list, subs_list, variant='b')

    #calcualte the score
    score = ((tau+1)/2.0) * 100 
    score = int(score+0.5)

    return score





if __name__ == "__main__":
    app.run(debug=True)
