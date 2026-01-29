import { Outlet } from "react-router";
import { makeStyles } from "@fluentui/react-components";
import { Header } from "./components/Header";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
});

function App() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
