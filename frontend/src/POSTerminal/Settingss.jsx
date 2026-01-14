import React, { useState, useRef, useEffect} from "react";
import './POSTerminalstyles/Settingss.css'
import { ShoppingCart, Search, User, LogOut, BarChart3, FileText, Settings, Package, ArrowLeft, Filter, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Settingss =()=> {

    const navigate = useNavigate('');
    return (
        <div className="settings-container">
            <div>
                <h1 className="header">
                    We Are Currently Working on this page...
                </h1>
            </div>
        </div>

    );

};

export default Settingss;