import React from "react";
import StatActivity from "./statactivity";
import renderer from "react-test-renderer";

test("Statactivty is rendered", () => {
  const rows = [];
  const fetchStatActivity = () => {
      
  }
  const component = renderer.create(
    <StatActivity rows={rows} loading={true} error={null} fetchStatActivity={fetchStatActivity} />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
