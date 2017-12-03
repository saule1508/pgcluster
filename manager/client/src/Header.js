import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'

import {Route, Link} from 'react-router-dom'

const NavItem = ({children, to, exact}) => {

    return (
        <Route path={to} exact={exact} children={(props) => {          
          return (
            <li className={props.match ? 'nav-item active' : 'nav-item'} >
                <Link to={to}>{children}</Link>
            </li>
          )
        }
        }/>
    )
}


class Header extends Component{
  render(){
    return(
      <div>
        <div className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
              <a className="pull-left brand hidden-sm" href="#"></a>
            </div>
            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
              <ul className="nav navbar-nav">
                
                  <NavItem exact={false} to="/postgres" >Postgres</NavItem>
                
                  <NavItem exact={false} to="/dash">Dashboard</NavItem>
                
                  <NavItem exact={false} to="/docker">Docker</NavItem>
                
              </ul>
              <ul className="nav navbar-nav navbar-right">
                <li>
                  <NavLink className="nav-link" to="/about">About</NavLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Header
  
 