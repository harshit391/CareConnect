import { useLocation } from "react-router-dom"
import ServiceCard from "../components/Cards/AuthService"
import { getRedirectPath } from "../utils/redirect";

const services = [
    {
        "title": "Sign Up as a User / Patient",
        "description": "Create an account as a patient to book appointments, get prescriptions, and access healthcare services.",
        "image": "/Auth/Person.jpeg",
        "link": "/auth/user"
    },
    {
        "title": "Sign Up as a Doctor / Hospital",
        "description": "Register as a doctor or hospital to provide healthcare services, manage appointments, and interact with patients.",
        "image": "/Auth/Doctor.png",
        "link": "/auth/hospital"

    },
]


const Auth = () => {

    const location = useLocation();

    const redirectPath = getRedirectPath(location.search, '/dashboard');

    console.log("Redirect Path at Auth", redirectPath);

    return (
        <div className="py-12">
            <div style={{ fontFamily: "RaleWay" }} className="text-2xl md:text-5xl font-bold text-center text-[#00ADB5]">Login / Register</div>
            <div className="flex flex-col md:flex-row p-8 md:p-12 gap-4 justify-center items-center">
                {services.map((service, index) => {
                    return <ServiceCard key={index} link={service.link + `?redirect=${redirectPath}`} title={service.title} description={service.description} image={service.image} />
                })}
            </div>
        </div>
    )
}

export default Auth;