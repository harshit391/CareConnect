import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: any;
    admin: any;
    loading: boolean;
    setUser: React.Dispatch<React.SetStateAction<any>>;
    setAdmin: React.Dispatch<React.SetStateAction<any>>;
    setSeverity: React.Dispatch<React.SetStateAction<string>>;
    severity: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

import { ReactNode } from "react";
import { verifyToken } from "../utils/auth";    

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    interface UserType {
        ok: string;
        role: any;
        _id: any;
    }

    const [user, setUser] = useState<UserType | null>(null);
    const [admin, setAdmin] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [severity, setSeverity] = useState<string>("Low");

    const handleChangesInSeverity = () => {
        const severityFromUser = localStorage.getItem("severity");

        if (severityFromUser === "Low") {
            setSeverity("Low");
            localStorage.setItem("severity", "Low");

        } else if (severityFromUser === "Moderate") {
            setSeverity("Moderate");
            localStorage.setItem("severity", "Moderate");
        } else if (severityFromUser === "High") {
            setSeverity("High");
            localStorage.setItem("severity", "High");
        } else {
            setSeverity("Low");
            localStorage.setItem("severity", "Low");
        }
    }



    useEffect(() => {
        const checkUser = async () => {
            try {
                const token = localStorage.getItem("eWauthToken");


                if (!token) {
                    setUser(null);
                    setAdmin(null);
                    setLoading(false);
                    return;
                }

                const response = await verifyToken(token);

                if (response.ok) {
                    setUser(response);

                    if (response.role === "ADMIN") {
                        setAdmin(response);
                    } else {
                        setAdmin(null);
                    }
                } else {
                    setUser(null);
                    setAdmin(null);
                }
            } catch (err) {
                setUser(null);
                setAdmin(null);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
        handleChangesInSeverity();
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, admin, loading, setUser, setAdmin, severity, setSeverity }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

