import os
import requests
import libsql

from flask import redirect, render_template, session
from functools import wraps

# Decorator to stop going to page where login is required
def login_required(f):
    @wraps(f)
    def decorated_function(*args,**kwargs):
        if session.get('user_id') is None:
            return redirect('/login')
        return f(*args,**kwargs)
    return decorated_function


# To get the db connection, this part is written by AI as I ran into some really complicated problems while deploying
def get_db_connection():
    db_url = os.environ.get("TURSO_DATABASE_URL")
    auth_token = os.environ.get("TURSO_AUTH_TOKEN")
    # Connect to Turso cloud database
    conn = libsql.connect(database=db_url, auth_token=auth_token)
    return conn

def query_db(query, args=(), one=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, args)
    
    # Grab the column names (e.g., 'username', 'userimg', 'total')
    columns = [col[0] for col in cursor.description]
    
    if one:
        row = cursor.fetchone()
        conn.close()
        # Convert the single tuple into a dictionary
        return dict(zip(columns, row)) if row else None
    else:
        rows = cursor.fetchall()
        conn.close()
        # Convert the list of tuples into a list of dictionaries
        return [dict(zip(columns, row)) for row in rows]
    
def modify_db(query, args=()):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Run the query
    cursor.execute(query, args)

    # Save the changes
    conn.commit()

    # Grab the ID of the newly inserted row
    last_id = cursor.lastrowid

    conn.close()
    return last_id