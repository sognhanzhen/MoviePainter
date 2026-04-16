import type { PosterRecord } from "../domain/app-data";

const importedMoviePosters = [
  ["inception", "Inception", "tt1375666", "27205", "https://assets.fanart.tv/fanart/inception-52df821bd2a9f.jpg", 31, "Christopher Nolan", "Action / Sci-Fi", "action film / adventure film / drama film / heist film / mystery film / science fiction action film / science fiction film / thriller film", "2010-07-08", "2010"],
  ["the-matrix", "The Matrix", "tt0133093", "603", "https://assets.fanart.tv/fanart/the-matrix-53b1a283180a1.jpg", 37, "Lana Wachowski / Lilly Wachowski", "Action / Sci-Fi", "action film / action thriller / cyberpunk / dystopian film / film noir / post-apocalyptic film / science fiction film / superhero film / thriller film", "1999-03-31", "1999"],
  ["parasite", "Parasite", "tt6751668", "496243", "https://assets.fanart.tv/fanart/parasite-5d2d59cb46671.jpg", 13, "Bong Joon-ho", "Black Comedy / Thriller", "black comedy / comedy drama / thriller film", "2019-05-21", "2019"],
  ["spirited-away", "Spirited Away", "tt0245429", "129", "https://assets.fanart.tv/fanart/spirited-away-53413e0abc9e5.jpg", 18, "Hayao Miyazaki", "Fantasy / Animation", "children's film / coming-of-age film / drama film / fantasy anime and manga / fantasy film / isekai / supernatural anime", "2001-07-20", "2001"],
  ["the-godfather", "The Godfather", "tt0068646", "238", "https://assets.fanart.tv/fanart/the-godfather-54b308c393048.jpg", 23, "Francis Ford Coppola", "Crime / Drama", "crime drama film / crime film / crime thriller film / drama film / epic film / gangster film / historical drama film / historical film / police procedural film / suspense film / thriller film", "1972-03-15", "1972"],
  ["pulp-fiction", "Pulp Fiction", "tt0110912", "680", "https://assets.fanart.tv/fanart/pulp-fiction-5229c921ab881.jpg", 22, "Quentin Tarantino", "Crime / Drama", "action film / action thriller / black comedy film / comedy drama / comedy film / crime comedy film / crime drama film / crime film / crime thriller film / drama film / gangster film / independent film / neo-noir / suspense film / thriller film", "1994-05-21", "1994"],
  ["the-dark-knight", "The Dark Knight", "tt0468569", "155", "https://assets.fanart.tv/fanart/the-dark-knight-551465d577af5.jpg", 50, "Christopher Nolan", "Action / Crime", "action film / crime film / crime thriller film / drama film / neo-noir / superhero film / thriller film", "2008-07-18", "2008"],
  ["la-la-land", "La La Land", "tt3783958", "313369", "https://assets.fanart.tv/fanart/la-la-land-5831aea494153.jpg", 24, "Damien Chazelle", "Musical / Romance", "comedy drama / comedy film / dance film / drama film / musical film / romance film", "2016-08-31", "2016"],
  ["mad-max-fury-road", "Mad Max: Fury Road", "tt1392190", "76341", "https://assets.fanart.tv/fanart/mad-max-fury-road-55dbd00d0685b.jpg", 47, "George Miller", "Action / Adventure", "action film / adventure film / dystopian film / post-apocalyptic film / science fiction film", "2015-05-13", "2015"],
  ["arrival", "Arrival", "tt2543164", "329865", "https://assets.fanart.tv/fanart/arrival-58926ee109e95.jpg", 33, "Denis Villeneuve", "Drama / Sci-Fi", "drama film / mystery film / science fiction film / thriller film", "2016-11-10", "2016"],
  ["blade-runner-2049", "Blade Runner 2049", "tt1856101", "335984", "https://assets.fanart.tv/fanart/blade-runner-2049-599f083ab57dc.jpg", 30, "Denis Villeneuve", "Sci-Fi / Neo-Noir", "action film / cyberpunk / drama film / dystopian film / mystery film / neo-noir / science fiction film / thriller film", "2017-10-04", "2017"],
  ["interstellar", "Interstellar", "tt0816692", "157336", "https://assets.fanart.tv/fanart/interstellar-550825f7cc108.jpg", 34, "Christopher Nolan", "Adventure / Sci-Fi", "adventure film / drama film / dystopian film / hard science fiction / science fiction film / thriller film / time-travel film", "2014-10-26", "2014"],
  ["everything-everywhere-all-at-once", "Everything Everywhere All at Once", "tt6710474", "545611", "https://assets.fanart.tv/fanart/everything-everywhere-all-at-once-624ef81c612d0.jpg", 12, "Dan Kwan / Daniel Scheinert", "Action / Comedy", "absurdist fiction / action film / comedy drama / martial arts film / psychedelic film / science fiction film", "2022-03-11", "2022"],
  ["dune", "Dune", "tt1160419", "438631", "https://assets.fanart.tv/fanart/dune-6120bd92ee626.jpg", 39, "Denis Villeneuve", "Adventure / Sci-Fi", "action film / adventure film / science fiction film / speculative fiction film", "2021-09-03", "2021"],
  ["dune-part-two", "Dune: Part Two", "tt15239678", "693134", "https://assets.fanart.tv/fanart/dune-part-two-6457e3e0d8a62.jpg", 21, "Denis Villeneuve", "Adventure / Sci-Fi", "action film / adventure film / epic film / science fiction film / speculative fiction film", "2024-02-27", "2024"],
  ["the-grand-budapest-hotel", "The Grand Budapest Hotel", "tt2278388", "120467", "https://assets.fanart.tv/fanart/the-grand-budapest-hotel-54ecd7f8a1c8b.jpg", 11, "Wes Anderson", "Comedy / Adventure", "adventure film / comedy film / crime film / drama film / romance film / tragicomedy", "2014-02-06", "2014"],
  ["her", "Her", "tt1798709", "152601", "https://assets.fanart.tv/fanart/her-53837900e3374.jpg", 7, "Spike Jonze", "Drama / Romance", "arthouse science fiction film / comedy film / drama film / romantic comedy / science fiction film", "2013-10-12", "2013"],
  ["get-out", "Get Out", "tt5052448", "419430", "https://assets.fanart.tv/fanart/get-out-58bde1a46246e.jpg", 23, "Jordan Peele", "Horror / Thriller", "comedy horror / horror film / mystery film / thriller film", "2017-01-24", "2017"],
  ["black-swan", "Black Swan", "tt0947798", "44214", "https://assets.fanart.tv/fanart/black-swan-54c15ffcecbdd.jpg", 17, "Darren Aronofsky", "Drama / Thriller", "drama film / horror film / LGBTQ-related film / magic realist film / psychological horror fiction / psychological thriller film / thriller film", "2010-09-01", "2010"],
  ["moonlight", "Moonlight", "tt4975722", "376867", "https://assets.fanart.tv/fanart/moonlight-588ca7e8d5254.jpg", 4, "Barry Jenkins", "Coming-of-Age / Drama", "coming-of-age film / drama film / LGBTQ-related film", "2016-09-02", "2016"],
  ["whiplash", "Whiplash", "tt2582802", "244786", "https://assets.fanart.tv/fanart/whiplash-54ec20a38b708.jpg", 10, "Damien Chazelle", "Drama / Music", "drama film / musical film", "2014-01-01", "2014"],
  ["the-social-network", "The Social Network", "tt1285016", "37799", "https://assets.fanart.tv/fanart/the-social-network-52ed797f9a03e.jpg", 5, "David Fincher", "Biographical / Drama", "biographical film / drama film / trial film", "2010-09-24", "2010"],
  ["no-country-for-old-men", "No Country for Old Men", "tt0477348", "6977", "https://assets.fanart.tv/fanart/no-country-for-old-men-533335897d05e.jpg", 10, "Ethan Coen / Joel Coen", "Crime / Thriller", "action film / adventure film / contemporary Western film / crime drama film / crime film / crime thriller film / drama film / gangster film / mystery film / neo-noir / psychological drama film / psychological thriller film / suspense film / thriller film / Western film", "2007-05-19", "2007"],
  ["the-shape-of-water", "The Shape of Water", "tt5580390", "399055", "https://assets.fanart.tv/fanart/the-shape-of-water-5a4e4240b8afd.jpg", 22, "Guillermo del Toro", "Fantasy / Romance", "drama film / fantasy film / magic realist film / melodrama / romance film / thriller film", "2017-08-31", "2017"],
  ["pans-labyrinth", "Pan's Labyrinth", "tt0457430", "1417", "https://assets.fanart.tv/fanart/pans-labyrinth-554d0987a2fe1.jpg", 18, "Guillermo del Toro", "Fantasy / War", "drama film / fantasy film / teen film / war film", "2006-05-27", "2006"],
  ["amelie", "Amelie", "tt0211915", "194", "https://assets.fanart.tv/fanart/amlie-532743df76c28.jpg", 6, "Jean-Pierre Jeunet", "Comedy / Romance", "comedy film / drama film / magic realist film / romantic comedy film", "2001-02-28", "2001"],
  ["crouching-tiger-hidden-dragon", "Crouching Tiger, Hidden Dragon", "tt0190332", "146", "https://assets.fanart.tv/fanart/crouching-tiger-hidden-dragon-530ee772852a3.jpg", 13, "Ang Lee", "Action / Romance", "action film / adventure film / drama film / fantasy film / martial arts film / romance film", "2000-05-18", "2000"],
  ["the-fellowship-of-the-ring", "The Lord of the Rings: The Fellowship of the Ring", "tt0120737", "120", "https://assets.fanart.tv/fanart/the-lord-of-the-rings-the-fellowship-of-the-ring-522af84750c20.jpg", 43, "Peter Jackson", "Adventure / Fantasy", "action film / adventure film / fantasy film", "2001-12-19", "2001"],
  ["the-silence-of-the-lambs", "The Silence of the Lambs", "tt0102926", "274", "https://assets.fanart.tv/fanart/the-silence-of-the-lambs-5487909ca88be.jpg", 24, "Jonathan Demme", "Crime / Horror", "crime drama film / crime film / crime thriller film / drama film / horror film / LGBTQ-related film / police procedural film / psychological drama film / psychological horror film / psychological thriller film / thriller film", "1991-01-30", "1991"],
  ["fight-club", "Fight Club", "tt0137523", "550", "https://assets.fanart.tv/fanart/fight-club-522a5477c7bd3.jpg", 21, "David Fincher", "Drama / Thriller", "drama film / flashback film / psychological thriller / thriller film", "1999-01-01", "1999"]
] as const;

const tonePresets = ["cold blue / amber contrast", "deep black / neon accent", "muted earth / gold", "rose red / shadow blue", "silver grey / warm spotlight"];
const moodPresets = ["tense / immersive", "dreamlike / mysterious", "intimate / melancholic", "epic / atmospheric", "stylized / kinetic"];
const layouts: PosterRecord["layout"][] = ["featured", "tall", "square", "wide"];

export const curatedMoviePosterRecords: PosterRecord[] = importedMoviePosters.map(
  ([id, title, imdbId, tmdbId, posterUrl, posterCount, director, genre, fullGenre, releaseDate, year], index) => ({
    attributes: {
      character: `Key characters and relationships from ${title}`,
      composition: "official vertical key art composition",
      mood: moodPresets[index % moodPresets.length],
      ratio: "2:3 vertical poster",
      style: `${genre} movie poster`,
      tone: tonePresets[index % tonePresets.length]
    },
    description:
      `${title} is imported from the fanart.tv poster library and completed with IMDb-matched metadata from Wikidata. ` +
      `Director: ${director}. Release date: ${releaseDate}. Full genre labels: ${fullGenre}.`,
    director,
    genre,
    id,
    imageUrl: posterUrl,
    imdbId,
    layout: layouts[index % layouts.length],
    posterCount,
    region: "fanart.tv / Wikidata",
    releaseDate,
    summary: `${director} film reference with a verified poster, release date, and genre metadata.`,
    tags: [year, director, genre, imdbId, `fanart posters ${posterCount}`],
    title,
    tmdbId,
    year
  })
);
