import { Route, Routes } from "react-router-dom"
import Home from "./components/Home.jsx"
import Login from "./components/Login.jsx"
import SignUp from "./components/SignUp.jsx"

export default function App() {
  return (
    <div className="w-full min-h-screen flex flex-col gap-10">
      <div>
        {/* NavBar here */}
      </div>
      <div>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}