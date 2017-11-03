import React, { Component } from 'react';
//import logo from './logo.svg';
//import 'bootstrap/dist/css/bootstrap.css';
import './styles/styles.css'
import Header from './Header'
import Home from './dash/components/Home.js'
import DockerHome from './docker/components/DockerHome.js'
import PostgresHome from './postgres/components/PostgresHome.js'
import { Switch, Route } from 'react-router-dom'


const Main = () => (
  <main>
    <Switch>
      <Route exact path='/' component={Home}/>
      <Route path='/docker' component={DockerHome} />
      <Route path='/postgres' component={PostgresHome}/>
    </Switch>
  </main>
)

class App extends Component {

  render() {
    return (
      <div>
        <Header />
        <div className="container-fluid">
          <Main />
        </div>
      </div>
    );
  }

}

export default App;
