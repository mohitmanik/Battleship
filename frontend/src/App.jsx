import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import DeployYourShip from './components/deployship'
import Deploy2 from './components/deploy2'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     {/* <Deploy2/> */}
     <DeployYourShip/>
    </>
  )
}

export default App
