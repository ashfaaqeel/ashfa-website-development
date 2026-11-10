import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SiteLayout } from '@/components/site-layout';
import Blog from '@/pages/blog';
import Books from '@/pages/books';
import CaseStudy from '@/pages/case-study';
import Home from '@/pages/home';
import NotFound from '@/pages/not-found';
import Admin from '@/pages/admin';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route path="/"><SiteLayout><Home /></SiteLayout></Route>
      <Route path="/blog"><SiteLayout><Blog /></SiteLayout></Route>
      <Route path="/case-study"><SiteLayout><CaseStudy /></SiteLayout></Route>
      <Route path="/books"><SiteLayout><Books /></SiteLayout></Route>
      <Route><SiteLayout><NotFound /></SiteLayout></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
