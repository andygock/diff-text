import React from "react";

const Footer = () => {
  // only show copyright notice when hosted on on gock.net
  if (window.location.hostname === "gock.net") {
    return (
      <div className="footer bp3-text-small">
        &copy; <a href="https://gock.net/">Andy Gock</a> /{" "}
        <a href="https://github.com/andygock/diff-text">GitHub</a>
      </div>
    );
  }

  return (
    <div className="footer bp3-text-small">
      <a href="https://github.com/andygock/diff-text">Source</a>
    </div>
  );
};

export default Footer;
