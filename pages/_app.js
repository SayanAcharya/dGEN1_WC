import '../styles/global.css'

export default function App({Component,pageProps}){
  return (
    <div className="app-shell">
      <div className="app-inner">
        <Component {...pageProps} />
      </div>
    </div>
  );
}
