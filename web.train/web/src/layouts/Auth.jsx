import { Link, Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="h-screen w-full grid grid-cols-1 md:grid-cols-2">
      <div className="middle">
        <Link to="/">
          {/* <img src="/logo.jpg" alt="logo" style={{ height: 80 }} /> */}
        </Link>
      </div>
      <div className="middle bg-white">
        <Outlet></Outlet>
      </div>
    </div>
  );
};

export default AuthLayout;
