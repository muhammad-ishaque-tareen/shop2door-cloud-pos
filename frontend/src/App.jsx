import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import About from "./components/About";
import ServicesPage from "./components/ServicesPage";
import Pricing from "./pages/Pricing";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import TrialExpiredWall from "./pages/TrialExpiredWall";
import ForgotPassword from "./pages/ForgotPassword"


import PaymentConfirmation from "./pages/PaymentConfirmation";
import POSTerminal from "./POSTerminal/POSTerminal";
import MyProfile from "./POSTerminal/MyProfile";
import ShiftReport from "./POSTerminal/ShiftReport";
import ReturnProduct from "./POSTerminal/ReturnProduct";
import MySales from "./POSTerminal/MySales";
import FindProducts from "./POSTerminal/FindProducts";
import Settingss from "./POSTerminal/Settingss";

import SystemAdminDashboard from "./SystemTerminal/SystemAdminDashboard";
import ShopRequests from "./SystemTerminal/ShopRequests";
import ManageShops from "./SystemTerminal/ManageShops";
import Packages from "./SystemTerminal/Packages";
import Subscriptions from "./SystemTerminal/Subscriptions"
import SystemAdminProfile from "./SystemTerminal/SystemAdminProfile";
import SystemSettings from "./SystemTerminal/Systemsettings";


import ShopSetup from "./pages/ShopSetup";
import ShopAdminDashboard from "./ShopAdminTerminal/ShopAdminDashboard";
import ShopProfile from "./ShopAdminTerminal/ShopProfile";
import Subscription from "./ShopAdminTerminal/Subscription";
import Myprofile from "./ShopAdminTerminal/Myprofile";
import MyStores from "./ShopAdminTerminal/Mystores";
import MyUsers from "./ShopAdminTerminal/Myusers";
import Products from "./ShopAdminTerminal/Products";
import Categories from "./ShopAdminTerminal/Categories";
import Inventory from "./ShopAdminTerminal/Inventory";
import SalesRecords from "./ShopAdminTerminal/SalesRecords";
import Suppliers from "./ShopAdminTerminal/Suppliers";
import ReportsAndAnalytics from "./ShopAdminTerminal/ReportsAndAnalytics";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/about" element={<About/>} />
      <Route path="/services" element={<ServicesPage/>} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pending" element={<PendingApproval />} />
      <Route path="/trial-expired" element={<TrialExpiredWall />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/posterminal" element={<POSTerminal />} />
      <Route path="/myprofile" element={<MyProfile />} />
      <Route path="/shiftreport" element={<ShiftReport />} />
      <Route path="/returnproduct" element={<ReturnProduct />} />
      <Route path="/mysales" element={<MySales />} />
      <Route path="/findproducts" element={<FindProducts />} />
      <Route path="/settingss" element={<Settingss />} />

      <Route path="/systemadmindashboard" element={<SystemAdminDashboard/>} />
      <Route path="/shoprequests" element={<ShopRequests/>} />
      <Route path="/manageshops" element={<ManageShops/>} />
      <Route path="/packages" element={<Packages/>} />
      <Route path="/subscriptions" element={<Subscriptions/>} />
      <Route path="/systemadminprofile" element={<SystemAdminProfile />} />
      <Route path="/systemsettings" element={<SystemSettings />} />




      <Route path="/shopsetup" element={<ShopSetup/>} />
      <Route path="/paymentconfirmation" element={<PaymentConfirmation />} />
      <Route path="/shopadmindashboard" element={<ShopAdminDashboard/>} />
      <Route path="/shopprofile" element={<ShopProfile />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/adminprofile" element={<Myprofile />} />
      <Route path="/mystores" element={<MyStores />} />
      <Route path="/myuser" element={<MyUsers />} />
      <Route path="/products" element={<Products />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/salesrecords" element={<SalesRecords />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/reportsandanalytics" element={<ReportsAndAnalytics />} />

    </Routes>
  );
};

export default App;
