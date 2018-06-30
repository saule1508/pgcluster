import React, { Component } from 'react'
import { Route, Link, Redirect } from 'react-router-dom'
import StatActivityContainer from './StatActivityContainer'
import ReplicationContainer from './replication/replicationcontainer'
import Backup from './backup/backupscontainer'


const NavItem = ({children, to, exact}) => {
    return (
        <Route path={to} exact={exact} children={({match}) => (
            <li className={match ? 'nav-item active' : 'nav-item' }>
                <Link to={to}>{children}</Link>
            </li>
        )}/>
    )
}

const Header = () => {
  return (
    <ul className="nav nav-tabs">
      <NavItem to="/postgres/replication">Replication</NavItem>
      <NavItem to="/postgres/backup">Backup</NavItem>
      <NavItem to="/postgres/stat_activity">Stat activity</NavItem>
    </ul>
  )

}

class PostgresHome extends Component{
  render(){
    return (
      <div>
        <h2>Postgres</h2>
        <Header />
        <Redirect from="/" to="/postgres/replication" />
        <Route exact path="/postgres" component={ReplicationContainer} />
        <Route path='/postgres/stat_activity' component={StatActivityContainer} /> 
        <Route path='/postgres/backup' exact={false} component={Backup} />
        <Route path='/postgres/replication' exact={false} component={ReplicationContainer} />      
      </div>
    )
  }
}

export default PostgresHome