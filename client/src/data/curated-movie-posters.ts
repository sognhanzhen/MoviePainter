import type { PosterRecord } from "./posters";
import { getPosterPromptPreset } from "./poster-prompt-presets";

type ImportedMoviePoster = {
  director: string;
  fullGenre: string;
  genre: string;
  id: string;
  imdbId: string;
  posterCount: number;
  posterUrl: string;
  releaseDate: string;
  title: string;
  tmdbId: string;
  year: string;
};

const importedMoviePosters: ImportedMoviePoster[] = [
  {
    id: "inception",
    title: "Inception",
    imdbId: "tt1375666",
    tmdbId: "27205",
    posterUrl: "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqNgAvMoWPI6Pw16s.jpg",
    posterCount: 31,
    director: "Christopher Nolan",
    genre: "Action / Sci-Fi",
    fullGenre: "action film / adventure film / drama film / heist film / mystery film / science fiction action film / science fiction film / thriller film",
    releaseDate: "2010-07-08",
    year: "2010"
  },
  {
    id: "the-matrix",
    title: "The Matrix",
    imdbId: "tt0133093",
    tmdbId: "603",
    posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    posterCount: 37,
    director: "Lana Wachowski / Lilly Wachowski",
    genre: "Action / Sci-Fi",
    fullGenre: "action film / action thriller / cyberpunk / dystopian film / film noir / post-apocalyptic film / science fiction film / superhero film / thriller film",
    releaseDate: "1999-03-31",
    year: "1999"
  },
  {
    id: "parasite",
    title: "Parasite",
    imdbId: "tt6751668",
    tmdbId: "496243",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    posterCount: 13,
    director: "Bong Joon-ho",
    genre: "Black Comedy / Thriller",
    fullGenre: "black comedy / comedy drama / thriller film",
    releaseDate: "2019-05-21",
    year: "2019"
  },
  {
    id: "spirited-away",
    title: "Spirited Away",
    imdbId: "tt0245429",
    tmdbId: "129",
    posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    posterCount: 18,
    director: "Hayao Miyazaki",
    genre: "Fantasy / Animation",
    fullGenre: "children's film / coming-of-age film / drama film / fantasy anime and manga / fantasy film / isekai / supernatural anime",
    releaseDate: "2001-07-20",
    year: "2001"
  },
  {
    id: "the-godfather",
    title: "The Godfather",
    imdbId: "tt0068646",
    tmdbId: "238",
    posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    posterCount: 23,
    director: "Francis Ford Coppola",
    genre: "Crime / Drama",
    fullGenre: "crime drama film / crime film / crime thriller film / drama film / epic film / gangster film / historical drama film / historical film / police procedural film / suspense film / thriller film",
    releaseDate: "1972-03-15",
    year: "1972"
  },
  {
    id: "pulp-fiction",
    title: "Pulp Fiction",
    imdbId: "tt0110912",
    tmdbId: "680",
    posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    posterCount: 22,
    director: "Quentin Tarantino",
    genre: "Crime / Drama",
    fullGenre: "action film / action thriller / black comedy film / comedy drama / comedy film / crime comedy film / crime drama film / crime film / crime thriller film / drama film / gangster film / independent film / neo-noir / suspense film / thriller film",
    releaseDate: "1994-05-21",
    year: "1994"
  },
  {
    id: "the-dark-knight",
    title: "The Dark Knight",
    imdbId: "tt0468569",
    tmdbId: "155",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe1ccAUJ.jpg",
    posterCount: 50,
    director: "Christopher Nolan",
    genre: "Action / Crime",
    fullGenre: "action film / crime film / crime thriller film / drama film / neo-noir / superhero film / thriller film",
    releaseDate: "2008-07-18",
    year: "2008"
  },
  {
    id: "la-la-land",
    title: "La La Land",
    imdbId: "tt3783958",
    tmdbId: "313369",
    posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    posterCount: 24,
    director: "Damien Chazelle",
    genre: "Musical / Romance",
    fullGenre: "comedy drama / comedy film / dance film / drama film / musical film / romance film",
    releaseDate: "2016-08-31",
    year: "2016"
  },
  {
    id: "mad-max-fury-road",
    title: "Mad Max: Fury Road",
    imdbId: "tt1392190",
    tmdbId: "76341",
    posterUrl: "https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
    posterCount: 47,
    director: "George Miller",
    genre: "Action / Adventure",
    fullGenre: "action film / adventure film / dystopian film / post-apocalyptic film / science fiction film",
    releaseDate: "2015-05-13",
    year: "2015"
  },
  {
    id: "arrival",
    title: "Arrival",
    imdbId: "tt2543164",
    tmdbId: "329865",
    posterUrl: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    posterCount: 33,
    director: "Denis Villeneuve",
    genre: "Drama / Sci-Fi",
    fullGenre: "drama film / mystery film / science fiction film / thriller film",
    releaseDate: "2016-11-10",
    year: "2016"
  },
  {
    id: "blade-runner-2049",
    title: "Blade Runner 2049",
    imdbId: "tt1856101",
    tmdbId: "335984",
    posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    posterCount: 30,
    director: "Denis Villeneuve",
    genre: "Sci-Fi / Neo-Noir",
    fullGenre: "action film / cyberpunk / drama film / dystopian film / mystery film / neo-noir / science fiction film / thriller film",
    releaseDate: "2017-10-04",
    year: "2017"
  },
  {
    id: "interstellar",
    title: "Interstellar",
    imdbId: "tt0816692",
    tmdbId: "157336",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    posterCount: 34,
    director: "Christopher Nolan",
    genre: "Adventure / Sci-Fi",
    fullGenre: "adventure film / drama film / dystopian film / hard science fiction / science fiction film / thriller film / time-travel film",
    releaseDate: "2014-10-26",
    year: "2014"
  },
  {
    id: "everything-everywhere-all-at-once",
    title: "Everything Everywhere All at Once",
    imdbId: "tt6710474",
    tmdbId: "545611",
    posterUrl: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    posterCount: 12,
    director: "Dan Kwan / Daniel Scheinert",
    genre: "Action / Comedy",
    fullGenre: "absurdist fiction / action film / comedy drama / martial arts film / psychedelic film / science fiction film",
    releaseDate: "2022-03-11",
    year: "2022"
  },
  {
    id: "dune",
    title: "Dune",
    imdbId: "tt1160419",
    tmdbId: "438631",
    posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    posterCount: 39,
    director: "Denis Villeneuve",
    genre: "Adventure / Sci-Fi",
    fullGenre: "action film / adventure film / science fiction film / speculative fiction film",
    releaseDate: "2021-09-03",
    year: "2021"
  },
  {
    id: "dune-part-two",
    title: "Dune: Part Two",
    imdbId: "tt15239678",
    tmdbId: "693134",
    posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg",
    posterCount: 21,
    director: "Denis Villeneuve",
    genre: "Adventure / Sci-Fi",
    fullGenre: "action film / adventure film / epic film / science fiction film / speculative fiction film",
    releaseDate: "2024-02-27",
    year: "2024"
  },
  {
    id: "the-grand-budapest-hotel",
    title: "The Grand Budapest Hotel",
    imdbId: "tt2278388",
    tmdbId: "120467",
    posterUrl: "https://image.tmdb.org/t/p/w500/eWDyPHPaMhnifINySDVHlBRxGDd.jpg",
    posterCount: 11,
    director: "Wes Anderson",
    genre: "Comedy / Adventure",
    fullGenre: "adventure film / comedy film / crime film / drama film / romance film / tragicomedy",
    releaseDate: "2014-02-06",
    year: "2014"
  },
  {
    id: "her",
    title: "Her",
    imdbId: "tt1798709",
    tmdbId: "152601",
    posterUrl: "https://image.tmdb.org/t/p/w500/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg",
    posterCount: 7,
    director: "Spike Jonze",
    genre: "Drama / Romance",
    fullGenre: "arthouse science fiction film / comedy film / drama film / romantic comedy / science fiction film",
    releaseDate: "2013-10-12",
    year: "2013"
  },
  {
    id: "get-out",
    title: "Get Out",
    imdbId: "tt5052448",
    tmdbId: "419430",
    posterUrl: "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
    posterCount: 23,
    director: "Jordan Peele",
    genre: "Horror / Thriller",
    fullGenre: "comedy horror / horror film / mystery film / thriller film",
    releaseDate: "2017-01-24",
    year: "2017"
  },
  {
    id: "black-swan",
    title: "Black Swan",
    imdbId: "tt0947798",
    tmdbId: "44214",
    posterUrl: "https://image.tmdb.org/t/p/w500/lBIaRFljS6jMEkuZxjyIuD6pQkT.jpg",
    posterCount: 17,
    director: "Darren Aronofsky",
    genre: "Drama / Thriller",
    fullGenre: "drama film / horror film / LGBTQ-related film / magic realist film / psychological horror fiction / psychological thriller film / thriller film",
    releaseDate: "2010-09-01",
    year: "2010"
  },
  {
    id: "moonlight",
    title: "Moonlight",
    imdbId: "tt4975722",
    tmdbId: "376867",
    posterUrl: "https://image.tmdb.org/t/p/w500/4911T5FbGnrgS39Py8VFSTMa5ag.jpg",
    posterCount: 4,
    director: "Barry Jenkins",
    genre: "Coming-of-Age / Drama",
    fullGenre: "coming-of-age film / drama film / LGBTQ-related film",
    releaseDate: "2016-09-02",
    year: "2016"
  },
  {
    id: "whiplash",
    title: "Whiplash",
    imdbId: "tt2582802",
    tmdbId: "244786",
    posterUrl: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    posterCount: 10,
    director: "Damien Chazelle",
    genre: "Drama / Music",
    fullGenre: "drama film / musical film",
    releaseDate: "2014-01-01",
    year: "2014"
  },
  {
    id: "the-social-network",
    title: "The Social Network",
    imdbId: "tt1285016",
    tmdbId: "37799",
    posterUrl: "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRhckkIRn.jpg",
    posterCount: 5,
    director: "David Fincher",
    genre: "Biographical / Drama",
    fullGenre: "biographical film / drama film / trial film",
    releaseDate: "2010-09-24",
    year: "2010"
  },
  {
    id: "no-country-for-old-men",
    title: "No Country for Old Men",
    imdbId: "tt0477348",
    tmdbId: "6977",
    posterUrl: "https://image.tmdb.org/t/p/w500/bj1v6YKF8yHqA489GFfAWUFwnRl.jpg",
    posterCount: 10,
    director: "Ethan Coen / Joel Coen",
    genre: "Crime / Thriller",
    fullGenre: "action film / adventure film / contemporary Western film / crime drama film / crime film / crime thriller film / drama film / gangster film / mystery film / neo-noir / psychological drama film / psychological thriller film / suspense film / thriller film / Western film",
    releaseDate: "2007-05-19",
    year: "2007"
  },
  {
    id: "the-shape-of-water",
    title: "The Shape of Water",
    imdbId: "tt5580390",
    tmdbId: "399055",
    posterUrl: "https://image.tmdb.org/t/p/w500/k4FwHlMhuRR5zp2nanL0iMZdKpB.jpg",
    posterCount: 22,
    director: "Guillermo del Toro",
    genre: "Fantasy / Romance",
    fullGenre: "drama film / fantasy film / magic realist film / melodrama / romance film / thriller film",
    releaseDate: "2017-08-31",
    year: "2017"
  },
  {
    id: "pans-labyrinth",
    title: "Pan's Labyrinth",
    imdbId: "tt0457430",
    tmdbId: "1417",
    posterUrl: "https://image.tmdb.org/t/p/w500/sOBQymVsZrTB5v01v5faocu8IhG.jpg",
    posterCount: 18,
    director: "Guillermo del Toro",
    genre: "Fantasy / War",
    fullGenre: "drama film / fantasy film / teen film / war film",
    releaseDate: "2006-05-27",
    year: "2006"
  },
  {
    id: "amelie",
    title: "Amelie",
    imdbId: "tt0211915",
    tmdbId: "194",
    posterUrl: "https://image.tmdb.org/t/p/w500/nSxDr3pPlnPCMx6lVMfmSQhibbo.jpg",
    posterCount: 6,
    director: "Jean-Pierre Jeunet",
    genre: "Comedy / Romance",
    fullGenre: "comedy film / drama film / magic realist film / romantic comedy film",
    releaseDate: "2001-02-28",
    year: "2001"
  },
  {
    id: "crouching-tiger-hidden-dragon",
    title: "Crouching Tiger, Hidden Dragon",
    imdbId: "tt0190332",
    tmdbId: "146",
    posterUrl: "https://image.tmdb.org/t/p/w500/iNDDKxvGMCseQiM7mHBhdOJTiPj.jpg",
    posterCount: 13,
    director: "Ang Lee",
    genre: "Action / Romance",
    fullGenre: "action film / adventure film / drama film / fantasy film / martial arts film / romance film",
    releaseDate: "2000-05-18",
    year: "2000"
  },
  {
    id: "the-fellowship-of-the-ring",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    imdbId: "tt0120737",
    tmdbId: "120",
    posterUrl: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    posterCount: 43,
    director: "Peter Jackson",
    genre: "Adventure / Fantasy",
    fullGenre: "action film / adventure film / fantasy film",
    releaseDate: "2001-12-19",
    year: "2001"
  },
  {
    id: "the-silence-of-the-lambs",
    title: "The Silence of the Lambs",
    imdbId: "tt0102926",
    tmdbId: "274",
    posterUrl: "https://image.tmdb.org/t/p/w500/uS9m8OBk1RVfUPvLCFZfRYjfTMQ.jpg",
    posterCount: 24,
    director: "Jonathan Demme",
    genre: "Crime / Horror",
    fullGenre: "crime drama film / crime film / crime thriller film / drama film / horror film / LGBTQ-related film / police procedural film / psychological drama film / psychological horror film / psychological thriller film / thriller film",
    releaseDate: "1991-01-30",
    year: "1991"
  },
  {
    id: "fight-club",
    title: "Fight Club",
    imdbId: "tt0137523",
    tmdbId: "550",
    posterUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QI4S2t0POtL.jpg",
    posterCount: 21,
    director: "David Fincher",
    genre: "Drama / Thriller",
    fullGenre: "drama film / flashback film / psychological thriller / thriller film",
    releaseDate: "1999-01-01",
    year: "1999"
  }
];

const tonePresets = ["cold blue / amber contrast", "deep black / neon accent", "muted earth / gold", "rose red / shadow blue", "silver grey / warm spotlight"];
const moodPresets = ["tense / immersive", "dreamlike / mysterious", "intimate / melancholic", "epic / atmospheric", "stylized / kinetic"];
const layouts: PosterRecord["layout"][] = ["featured", "tall", "square", "wide"];

export const curatedMoviePosterRecords: PosterRecord[] = importedMoviePosters.map((movie, index) => ({
  attributes: {
    character: `Key characters and relationships from ${movie.title}`,
    composition: "official vertical key art composition",
    mood: moodPresets[index % moodPresets.length],
    ratio: "2:3 vertical poster",
    style: `${movie.genre} movie poster`,
    tone: tonePresets[index % tonePresets.length]
  },
  catalogCategory: "movie",
  description:
    `${movie.title} is imported from the fanart.tv poster library and completed with IMDb-matched metadata from Wikidata. ` +
    `Director: ${movie.director}. Release date: ${movie.releaseDate}. Full genre labels: ${movie.fullGenre}.`,
  director: movie.director,
  genre: movie.genre,
  id: movie.id,
  imageUrl: movie.posterUrl,
  imdbId: movie.imdbId,
  layout: layouts[index % layouts.length],
  posterCount: movie.posterCount,
  promptPresets: getPosterPromptPreset(movie.id),
  region: `fanart.tv / Wikidata`,
  releaseDate: movie.releaseDate,
  summary: `${movie.director} film reference with a verified poster, release date, and genre metadata.`,
  tags: [movie.year, movie.director, movie.genre, movie.imdbId, `fanart posters ${movie.posterCount}`],
  title: movie.title,
  tmdbId: movie.tmdbId,
  year: movie.year
}));
