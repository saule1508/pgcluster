import React, { Component } from 'react';
//import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.css';
//import '../node_modules/evs-themes-web-bootstrap3/dist/css/bootstrap-light-evs.css';
import './styles/bootstrap-light-evs.css';
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
      <div className="container-fluid">
        <Header />
        <Main />
      </div>
    );
  }

}

export default App;
