import React from 'react';
// import logo from './logo.svg';
// import 'bootstrap/dist/css/bootstrap.css';
import './styles/styles.scss';
import { Switch, Route } from 'react-router-dom';
import Header from './Header';
import DashHome from './dash/components/Home';
import DockerHome from './docker/components/DockerHome';
import PostgresHome from './postgres/components/PostgresHome';

const Main = () => (
  <main>
    <Switch>
      <Route exact path="/" component={PostgresHome} />
      <Route path="/postgres" component={PostgresHome} />
      <Route path="/docker" component={DockerHome} />
      <Route path="/dash" component={DashHome} />
    </Switch>
  </main>
);

const App = () => (
  <div>
    <Header />
    <div className="container-fluid">
      <Main />
    </div>
  </div>
);

export default App;
