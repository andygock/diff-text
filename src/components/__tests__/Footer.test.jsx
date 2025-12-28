import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Footer from "../Footer";

const originalLocation = window.location;

const setHostname = (hostname) => {
  Object.defineProperty(window, "location", {
    value: { ...originalLocation, hostname },
    configurable: true,
    writable: true,
  });
};

describe("Footer", () => {
  beforeEach(() => {
    setHostname("example.com");
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });

  it("shows GitHub link for non-gock.net hosts", () => {
    render(<Footer />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.queryByText("Andy Gock")).not.toBeInTheDocument();
  });

  it("shows copyright when hosted on gock.net", () => {
    setHostname("gock.net");
    render(<Footer />);
    expect(screen.getByText("Andy Gock")).toBeInTheDocument();
  });
});
