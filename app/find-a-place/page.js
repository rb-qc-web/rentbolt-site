import FindAPlaceClient from "./FindAPlaceClient";

export const metadata = {
  title: "Find a Place | RentBolt",
  description: "Tell us what you're looking for and a RentBolt agent will match you with available units — usually within a few hours.",
};

export default function FindAPlacePage() {
  return <FindAPlaceClient />;
}
