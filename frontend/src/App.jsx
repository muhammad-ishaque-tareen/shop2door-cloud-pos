import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import About from "./components/About";
import ServicesPage from "./components/ServicesPage";
import Pricing from "./pages/Pricing";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import POSTerminal from "./POSTerminal/POSTerminal";
import MyProfile from "./POSTerminal/MyProfile";
import ShiftReport from "./POSTerminal/ShiftReport";
import ReturnProduct from "./POSTerminal/ReturnProduct";
import MySales from "./POSTerminal/MySales";
import FindProducts from "./POSTerminal/FindProducts";
import Settingss from "./POSTerminal/Settingss";


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/about" element={<About/>} />
      <Route path="/services" element={<ServicesPage/>} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/payementconfirmation" element={<PaymentConfirmation />} />
      <Route path="/posterminal" element={<POSTerminal />} />
      <Route path="/myprofile" element={<MyProfile />} />
      <Route path="/shiftreport" element={<ShiftReport />} />
      <Route path="/returnproduct" element={<ReturnProduct />} />
      <Route path="/mysales" element={<MySales />} />
      <Route path="/findproducts" element={<FindProducts />} />
      <Route path="/settingss" element={<Settingss />} />
    </Routes>
  );
};

export default App;
