const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//get list of Movies
const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

//get list of Directors
const convertDirectorDbObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
  select * from movie;`
  const moviesArray = await db.all(getMoviesQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
  select * from movie where movie_id = ${movieId};`
  const movie = await db.get(getMovieQuery)
  response.send(convertDbObjectToResponseObject(movie))
})

//create a new player

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    Insert into movie (director_id,movie_name,lead_actor)
    values (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    )`
  const dbResponse = await db.run(addMovieQuery)
  const movieId = dbResponse.lastID
  response.send('Movie Successfully Added')
})

// update a movie

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updateMovieQuery = `
    Update movie Set 
    director_id = '${directorId}',
    movie_name = '${movieName}',
    lead_actor = '${leadActor}' where movie_id = ${movieId}; 
  `
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//Delete A Movie

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE from movie where movie_id = ${movieId};`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

//Returns a list of all directors in the director table
app.get('/directors/', async (request, response) => {
  const getdirectorQuery = `
  select * from director;`
  const directorsArray = await db.all(getdirectorQuery)
  response.send(
    directorsArray.map(eachdirector =>
      convertDirectorDbObjectToResponseObject(eachdirector),
    ),
  )
})

//Returns a list of all movie names directed by a specific director
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getdirectorMovieQuery = `
  select movie_name from movie Where director_id = ${directorId}; `
  const moviesArray = await db.all(getdirectorMovieQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

module.exports = app
