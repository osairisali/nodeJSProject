# nodeJSProject

This is my project course in learning NodeJS. I delibeartely make ridiculous comments and some unnecessary text files in the codes to write down my understanding of how the they work. So, my apologies :see_no_evil:

To run this project, you need a mongodb atlas account and place them at the start script in package.json file. You may need to set up your own nodemon.json file to add your mongodb atlas credentials, so that you can access their value using nodemon. The structure in nodemon.json is like this:
`{"env": { "MONGO_USER": "yourMONGODBUserName", "MONGO_PASSWORD": "YourP@55w0Rd", "MONGO_DEFAULT_DATABASE": "shop", "APP_PORT": 3000 }}`

This is a simple nodejs project that demonstrates of CRUD in mongodb, site routing, and so simple frontend using ejs.
Web implementation including user authorization, product CRUD, password reset via link sent to registered email (email communication using mailtrap service), invoice creation, and pagination.
