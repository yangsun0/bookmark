import React from "react";
import { Row, Col } from "react-bootstrap";
import BookMarkGroup from "./BookmarkGroup";

function Body({ groups }) {
  const leftGroups = groups
    .filter((group) => group.column === 1)
    .map((group) => <BookMarkGroup {...group} />);
  const rightGroups = groups
    .filter((group) => group.column === 2)
    .map((group) => <BookMarkGroup {...group} />);
  return (
    <Row>
      <Col sm>{leftGroups}</Col>
      <Col sm>{rightGroups}</Col>
    </Row>
  );
}

export default Body;
