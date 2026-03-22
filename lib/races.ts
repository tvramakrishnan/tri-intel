export type Race = {
  name: string;
  date: string;
  location: string;
  distance: string;
  beginnerScore: number;
  medianFinish: string;
  p75Finish: string;
};

export const races: Race[] = [
  {
    name: "Lake Chelan Sprint Triathlon",
    date: "Aug 2 2025",
    location: "Chelan, WA",
    distance: "Sprint",
    beginnerScore: 9,
    medianFinish: "1:28",
    p75Finish: "1:47",
  },
  {
    name: "Rainier Sprint Triathlon",
    date: "Jul 19 2025",
    location: "Eatonville, WA",
    distance: "Sprint",
    beginnerScore: 10,
    medianFinish: "1:18",
    p75Finish: "1:35",
  },
  {
    name: "Seafair Triathlon",
    date: "Jul 20 2025",
    location: "Seattle, WA",
    distance: "Sprint",
    beginnerScore: 7,
    medianFinish: "1:35",
    p75Finish: "1:58",
  },
  {
    name: "Columbia Gorge Olympic",
    date: "Sep 6 2025",
    location: "Hood River, OR",
    distance: "Olympic",
    beginnerScore: 5,
    medianFinish: "2:44",
    p75Finish: "3:18",
  },
];
