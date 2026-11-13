import { Link } from "react-router-dom";

export default function SmartLink({ to = "/", className, children, ...rest }) {
  if (/^https?:/i.test(to) || to.startsWith("mailto:")) {
    return (
      <a className={className} href={to} target={to.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to={to || "/"} {...rest}>
      {children}
    </Link>
  );
}
