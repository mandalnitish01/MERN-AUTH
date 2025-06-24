import React from "react";
import "../styles/Instructor.css";
import instructorImage from "../assets/profile.png";

const Instructor = () => {
  return (
    <div className="instructor-page">
      <div className="instructor-card">
        <div className="instructor-image">
          <img src={instructorImage} alt="Instructor" />
        </div>
        <div className="instructor-info">
          <h1>Nitish Kumar Mandal</h1>
          <h4>Your Brother</h4>
          <p>
           Lorem ipsum dolor sit, amet consectetur adipisicing elit. Qui ipsum illum quas cupiditate dolorum! Placeat illo debitis, culpa natus perferendis excepturi quod obcaecati alias, corrupti quaerat sed reiciendis, praesentium repellendus?
          </p>
          <div className="social-links">
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Youtube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
