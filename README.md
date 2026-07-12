# AnimeTakes
### Video Demo: 
### Description:

This is my final project for CS50. It's a web app that lets people create Tierlists related to anime and share them with their friends and other people, so they can make their own version of that Tierlist. But the core functionality is the ratings that are calculated based on how similarly other people create that Tierlist, called the ***Similarity Score***.
---
### Key Feautures:
* **Create and Share:** People can create Tierlists about Anime, Characters, and Manga. And also share it by using the *Copy link and share* button.
* **Compare your own version:** When you open the link, you can choose to *reveal the tierlist*, and you can also *Create your own version* with the same items the original had.
* **Score and Ratings:** Once people create their own version they get a *Similarity Score*, based on how similar they are to the orignal. And the overall tierlist also gets a *Rating* based on the averages of all scores.
* **Comments:** After you get the score, you can choose to add a comment to that tierlist about your opinions on it.
---
### Technologies used:
* **Frontend:** HTML, CSS, and JavaScript along with the Bootstrap library.
* **Backend:** JavaScript and Python with Flask.
* **Database:** SQLite ( Turso, more precisely, a cloud-based version of it)
* **APIs:** OAuth and Jikan
---
### Project Structure and File Explanations

Here is a breakdown of the core files in this project and their specific roles:

**Flask files**
* `app.py`: The main application controller. It contains all the routing logic for logging in, handling the database, rendering the pages, and functions for the similarity score logic.
* `helpers.py`: Contains the decorator function to require login for some pages, and two functions for converting the SQLite syntax I used for Turso.

**CSS files**
* `static/style.css`: Holds all custom CSS to style the tier list rows (S, A, B, C, D tiers), user interface, and mobile responsiveness.

**JS files**
* `static/viewlist.js`: JS file for the viewlist HTML page, contains the logic for the popover rating circles
* `static/createlist.js`: JS file for the createlist HTML page, handles the logic for the sortable items, parsing the data to the createlist route, and toggling modals. 
* `static/createsubs.js`: JS file for the createsubs HTML page, similar to the createlis.js but for the submissions(comments).
* `static/index.js`: JS file for the index page, also handles the popover rating circles, and toggling the change username button.

**HTML pages**
* `templates/layout.html`: The base Jinja template containing the navigation bar and universal HTML head elements.
* `templates/login.html`: The landing or login page.
* `templates/index.html`: The Dashboard for the person logged in. They can change their username and create the Tierlists. All previously created Tierlists are shown.
* `templates/error.html`: Opens when any error happens
* `templates/viewlist.html`: The page that displays a finished tier list, houses the comment section, and provides the "Compare it with your own!" button.
* `templates/createlist.html` and `templates/createsubs.html`: The page that has the interface for creating Tierlists and their submissions, respectively.
* `templates/results.html`: The page that displays the similarity score and side-by-side comparison of the original and the made-up version. Those who made it can also comment on it.

---

### Design Choices and Challenges

**The Similarity Algorithm**
One of the most complex parts of this project was determining how to calculate the similarity between two lists. I chose to implement Kendall's tau formula through the scipy and numpy libraries.

**Handling Drag-and-Drop**
Implementing the tier-list interface required a lot of frontend logic. I simplified it by using the library Sortable JS and used the info from the docs to do the drag and drop. And the Bootstrap grid system was used to make the interface for the create Tierlist page.  

**Database Structure**
Initially really simple to use SQLite when I was running it on my computer. But deploying turned out to be really complicated. So I used Turso, which is a cloud-based SQLite database, and used AI to teach me the process of integrating it.

**The CSS and design**
I created a really simple CSS version of this at the start. But I couldn't get it to look good or be mobile-responsive. So I took a lot of code from the Gemini AI that I understood and modified myself to use. 

---
### How to run?
The requirements.txt is provided for all the libraries I have used. The api keys are to be your own to use this project.
The Database can be initialized by the following commands, and it has three tables:

**The users table**
```
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uniquemail TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    userimg TEXT NOT NULL
);
```
**Create lists table**
```
CREATE TABLE lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    jsonlist TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```
**Create submissions table**
```
CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment TEXT,
    list_id INTEGER NOT NULL,
    jsonsubmission TEXT NOT NULL,
    username TEXT NOT NULL,
    similarity_score INTEGER NOT NULL,
    FOREIGN KEY(list_id) REFERENCES lists(id)
);
```
Thank you :)
---
