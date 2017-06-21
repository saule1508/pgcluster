import React, { Component } from 'react'
import { Route, Link } from 'react-router-dom'
import DF from './DF'
import DockerInfo from './DockerInfo'


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
      <NavItem to="/docker/info">Info</NavItem>
      <NavItem to="/docker/df">disk usage</NavItem>
    </ul>
  )

}

class DockerHome extends Component{
	render(){
		return (
			<div>
        <h2>Docker</h2>
        <Header />
        
        <Route path='/docker/info' component={DockerInfo} />
        <Route path='/docker/df' component={DF} />
      
      </div>
		)
	}
}

export default DockerHome