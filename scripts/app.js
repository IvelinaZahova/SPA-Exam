import {createFormEntity} from './form-helpers.js'
import {fireBaseRequestFactory} from './firebase-requests.js'
import { requester } from './app-service.js';
import {successNotification}  from './notifications.js'
import {errorNotification}  from './notifications.js'

const apiKey = 'https://exam-cbe63.firebaseio.com/';
requester.init(apiKey, sessionStorage.getItem('token'));

async function applyComman(){
    ////load hbs templates
    this.partials = {
        header: await this.load('./templates/common/header.hbs'),
        footer: await this.load('./templates/common/footer.hbs')
    }

    //Gets data about the user and adds it the context
    this.email = sessionStorage.getItem('email');
    this.loggedIn = !!sessionStorage.getItem('token');
}

async function homeViewHandler() {
    //load hbs templates
    await applyComman.call(this);

    let articles = await requester.articles.getAll();

    this.articles = Object.entries(articles || {}).map(([articleId, article]) => ({...article, articleId}) );
    //console.log(this.treks);
    

    this.loggedInWitharticles = sessionStorage.getItem('token') && this.articles.length > 0;
    //no category
    this.loggedInWithNoarticles = sessionStorage.getItem('token') && this.articles.length === 0;

    this.partial('./templates/home/home.hbs');

}

async function loginHandler() {

    //load hbs templates
    await applyComman.call(this);
    await this.partial('./templates/login/loginPage.hbs');
   
    //console.log(document.querySelector('#login-form'));

    let formRef = document.querySelector('form');
    
    formRef.addEventListener('submit', async e => {
        e.preventDefault();

        let form = createFormEntity(formRef, ['email','password'])
        let formValue = form.getValue();

        
        //Authenticates a user with email and password
        const loggedInUser = await firebase.auth().signInWithEmailAndPassword(formValue.email, formValue.password);
        const userToken = await firebase.auth().currentUser.getIdToken();
        sessionStorage.setItem('userId', firebase.auth().currentUser.uid);
        sessionStorage.setItem('email', loggedInUser.user.email);
       
        //Updates the requester authentication token
        sessionStorage.setItem('token', userToken);
        requester.setAuthToken(userToken);

        this.redirect(['#/home']);

    })
}

async function registerViewHandler() {
     //load hbs templates
    await applyComman.call(this);
    await this.partial('./templates/register/registerPage.hbs');
    
    
    //Handling form events part
    let formRef = document.querySelector('form');
    formRef.addEventListener('submit', async (e) => {
        e.preventDefault();
        let form = createFormEntity(formRef, ['email', 'password', 'rep-pass']);
        let formValue = form.getValue();

        // if (formValue.password === formValue.rep-pass && formValue.email.length >= 3 && formValue.password.length >= 6) {
        //     successNotification('Successfully registered user.');
        // } else {
        //     errorNotification('Invalid input!');            
        // }

        //Creates new user
        const newUser = await firebase.auth().createUserWithEmailAndPassword(formValue.email, formValue.password);

        let userToken = await firebase.auth().currentUser.getIdToken();
        sessionStorage.setItem('email', newUser.user.email);
        sessionStorage.setItem('userId', firebase.auth().currentUser.uid);

        sessionStorage.setItem('token', userToken);
        
        //Updates the requester authentication token
        requester.setAuthToken(userToken);

        this.redirect(['#/home']);
        
    });
}

function logoutHandler(){
    sessionStorage.clear();
    firebase.auth().signOut();
    this.redirect(['#/login']);
}

async function createTrekHandler(){
    //load hbs templates
    await applyComman.call(this);
    //this.partials.createForm = await this.load('./templates/create/createForm.hbs');
    await this.partial('./templates/create/createPage.hbs');

    //create-form
    let formRef = document.querySelector('form');
    formRef.addEventListener('submit', async e => {
        e.preventDefault();

        //const firebaseTeams = fireBaseRequestFactory('https://exam-cbe63.firebaseio.com/', 'teams', sessionStorage.getItem('token'));

        let form = createFormEntity(formRef, ['title','category', 'content'])
        let formValue = form.getValue();
        formValue.createdById = sessionStorage.getItem('userId');
        formValue.creator = sessionStorage.getItem('email');
        
        //request to back-end

        //firebaseTeams.createEntity(formValue).then(x => console.log(x));
        await requester.articles.createEntity(formValue);
        //this.redirect('#/home')
        form.clear();
        this.redirect('#/home')
    })
}

async function detailsHandler(){

    //comes from the navigation

    //this.teamId = this.params.id;
    let {category, content, creator, title, createdById } = await requester.articles.getById(this.params.id);
    this.articleId = this.params.id;
    this.category = category;
    this.content = content;
    this.creator = creator;
    this.title = title;
    this.createdById = createdById;

    this.userIsCreator = sessionStorage.getItem('userId') === createdById;

    //load hbs templates
    await applyComman.call(this);
    this.partial('./templates/details/details.hbs');

}

async function editHandler(){
     //load hbs templates
    await applyComman.call(this);
    await this.partial('./templates/edit/editPage.hbs');

    //Handling form events part
    let formRef = document.querySelector('form');
    let form = createFormEntity(formRef, ['title', 'category', 'content']);

    //Load and set the initial form value for edit
    const trekToEdit = await requester.articles.getById(this.params.id);
    form.setValue(trekToEdit);

    formRef.addEventListener('submit', async e => {
        e.preventDefault();

        let form = createFormEntity(formRef, ['title', 'category', 'content']);
        let formValue = form.getValue();

        await requester.articles.patchEntity(formValue, this.params.id);
    });

    //this.redirect('#/home');
}

async function deleteHandler(){
    await requester.articles.deleteEntity(this.params.id);

    this.redirect('#/home');
}

// initialize the application
var app = Sammy('#root', function() {
    // include a plugin
    this.use('Handlebars', 'hbs');
  
    // define a 'route'
    this.get('#/', homeViewHandler);
    this.get('#/home', homeViewHandler);

    //register 
    this.get('#/register', registerViewHandler);
    this.post('#/register', () => false);

    //Log In
    this.get('#/login', loginHandler);
    this.post('#/login', () => false);

    //log Out
    this.get('#/logout', logoutHandler);

    //create article
    this.get('#/create', createTrekHandler);
    this.post('#/create', () => false);

    //details
    // this.get('#/details/{{trekId}}', logoutHandler);
    this.get('#/details/:id', detailsHandler);

    //edit
    this.get('#/edit/:id', editHandler);
    this.post('#/edit/:id', () => false);

    //delete
    this.get('#/delete/:id', deleteHandler);
    this.post('#/delete/:id', () => false);
});
  
// start the application
app.run('#/');

