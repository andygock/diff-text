import React from "react";

const Footer = () => {
  // only show copyright notice when hosted on on gock.net
  if (window.location.hostname === "gock.net") {
    return (
      <div className="footer">
        &copy; <a href="https://gock.net/">Andy Gock</a> /{" "}
        <a href="https://github.com/andygock/diff-text">GitHub</a>
      </div>
    );
  }

  return (
    <div className="footer">
      <a href="https://github.com/andygock/diff-text">GitHub</a>
    </div>
  );
};

export default Footer;
