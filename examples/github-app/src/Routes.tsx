import { Route, Switch, RouteProps } from 'react-router-dom';
import Boundary from 'Boundary';

import IssueList from './pages/IssueList';
import IssueDetail from './pages/IssueDetail';
import ProfileDetail from './pages/ProfileDetail';

function Home({ location }: RouteProps) {
  const page = Number.parseInt(
    new URLSearchParams(location && location.search.substring(1)).get('page') ||
      '1',
    10,
  );
  return (
    <Boundary fallback="">
      <IssueList
        repositoryUrl="https://api.github.com/repos/facebook/react"
        page={page}
      />
    </Boundary>
  );
}
function Closed() {
  return (
    <IssueList
      repositoryUrl="https://api.github.com/repos/facebook/react"
      state="closed"
    />
  );
}
function Open() {
  return (
    <IssueList
      repositoryUrl="https://api.github.com/repos/facebook/react"
      state="open"
    />
  );
}
const Routes = () => (
  <Boundary>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/closed" component={Closed} />
      <Route exact path="/open" component={Open} />
      <Route exact path="/issues" component={IssueList} />
      <Route path="/issue/:number" component={IssueDetail} />
      <Route exact path="/profile" component={ProfileDetail} />
    </Switch>
  </Boundary>
);
export default Routes;
