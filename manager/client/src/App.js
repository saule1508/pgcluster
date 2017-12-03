import React, { Component } from 'react';
//import logo from './logo.svg';
//import 'bootstrap/dist/css/bootstrap.css';
import './styles/styles.css'
import Header from './Header'
import DashHome from './dash/components/Home.js'
import DockerHome from './docker/components/DockerHome.js'
import PostgresHome from './postgres/components/PostgresHome.js'
import { Switch, Route, Redirect } from 'react-router-dom'


const Main = () => (
  <main>
    <Switch> 
      <Route exact path='/' component={PostgresHome}/>
      <Route path='/postgres' component={PostgresHome}/>
      <Route path='/docker' component={DockerHome} />
      <Route path='/dash' component={DashHome}/>
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
