const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find( user => user.username === username);
  
  if(!user){
    return response.status(400).json({error: "User not found!"});
  }

  request.user = user;

  return next();
}

function checkIfTodoIdExists(request, response, next){
  const { user } = request;
  const { id } = request.params;

  const validId = user.todos.find(todo => todo.id === id);

  if(!validId){
    return response.status(404).json({error: "To do doesn\'t exists"});
  }

  request.todo = validId;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username} = request.body;

  const usernameAlreadyExists = users.some(user => user.username === username);
  
  if(usernameAlreadyExists){
    return response.status(400).json({error: "User name already exists!"});
  }
  const user = {
    id: uuidv4(),
    name,
    username,
    todos:[]
  }
  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checkIfTodoIdExists, (request, response)=> {
  const { user, todo } = request;
  const { title, deadline} = request.body
  
  const updatedTodo = {
    ...todo,
    title,
    deadline: new Date(deadline)
  };

  //Substitue os valoresa antigos do todo antes do update
  const todoWithNewValues = user.todos.map(currentTodo => currentTodo.id === todo.id ? updatedTodo : currentTodo);

  user.todos = [...todoWithNewValues];

  return response.status(201).json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkIfTodoIdExists, (request, response) => {
  const { user, todo } = request;
  const updateDone = {
    ...todo,
    done: true
  }

    //Substitue os valores antigos do todo antes do update
  const todoWithNewValues = user.todos.map(currentTodo => currentTodo.id === todo.id ? updateDone : currentTodo);
  
  user.todos = [...todoWithNewValues];

  return response.status(201).json(updateDone);
});

app.delete('/todos/:id', checksExistsUserAccount, checkIfTodoIdExists, (request, response) => {
  const { user, todo } = request;
  
  user.todos.splice(todo, 1);

  return response.status(204).json(user.todos);
});

module.exports = app;