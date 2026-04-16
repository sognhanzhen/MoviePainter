# Fanart + Metadata API Test Results

Checked at: 2026-04-16T09:15:22.327Z

Pipeline:

- Poster and movie title: `https://webservice.fanart.tv/v3/movies/{imdbId}`
- Missing metadata fill: `https://query.wikidata.org/sparql`
- Matching key: IMDb ID

Required fields:

- `poster`
- `title`
- `genre`
- `releaseDate`
- `director`

Field format:

- `poster`: image URL
- `title`: English movie title from fanart.tv
- `genre`: English labels separated by ` / `
- `releaseDate`: `YYYY-MM-DD`
- `director`: names separated by ` / `

Summary:

- Total: 10
- Passed: 10
- Failed: 0

## Results

### 1. Inception

- IMDb ID: `tt1375666`
- TMDb ID: `27205`
- Poster count from fanart.tv: `31`
- Poster: https://assets.fanart.tv/fanart/inception-52df821bd2a9f.jpg
- Title: Inception
- Genre: action film / adventure film / drama film / heist film / mystery film / science fiction action film / science fiction film / thriller film
- Release date: 2010-07-08
- Director: Christopher Nolan
- Result: PASS

### 2. The Matrix

- IMDb ID: `tt0133093`
- TMDb ID: `603`
- Poster count from fanart.tv: `37`
- Poster: https://assets.fanart.tv/fanart/the-matrix-53b1a283180a1.jpg
- Title: The Matrix
- Genre: action film / action thriller / cyberpunk / dystopian film / film noir / post-apocalyptic film / science fiction film / superhero film / thriller film
- Release date: 1999-03-31
- Director: Lana Wachowski / Lilly Wachowski
- Result: PASS

### 3. Parasite

- IMDb ID: `tt6751668`
- TMDb ID: `496243`
- Poster count from fanart.tv: `13`
- Poster: https://assets.fanart.tv/fanart/parasite-5d2d59cb46671.jpg
- Title: Parasite
- Genre: black comedy / comedy drama / thriller film
- Release date: 2019-05-21
- Director: Bong Joon-ho
- Result: PASS

### 4. Spirited Away

- IMDb ID: `tt0245429`
- TMDb ID: `129`
- Poster count from fanart.tv: `18`
- Poster: https://assets.fanart.tv/fanart/spirited-away-53413e0abc9e5.jpg
- Title: Spirited Away
- Genre: children's film / coming-of-age film / drama film / fantasy anime and manga / fantasy film / isekai / supernatural anime
- Release date: 2001-07-20
- Director: Hayao Miyazaki
- Result: PASS

### 5. The Godfather

- IMDb ID: `tt0068646`
- TMDb ID: `238`
- Poster count from fanart.tv: `23`
- Poster: https://assets.fanart.tv/fanart/the-godfather-54b308c393048.jpg
- Title: The Godfather
- Genre: crime drama film / crime film / crime thriller film / drama film / epic film / gangster film / historical drama film / historical film / police procedural film / suspense film / thriller film
- Release date: 1972-03-15
- Director: Francis Ford Coppola
- Result: PASS

### 6. Pulp Fiction

- IMDb ID: `tt0110912`
- TMDb ID: `680`
- Poster count from fanart.tv: `22`
- Poster: https://assets.fanart.tv/fanart/pulp-fiction-5229c921ab881.jpg
- Title: Pulp Fiction
- Genre: action film / action thriller / black comedy film / comedy drama / comedy film / crime comedy film / crime drama film / crime film / crime thriller film / drama film / gangster film / independent film / neo-noir / suspense film / thriller film
- Release date: 1994-05-21
- Director: Quentin Tarantino
- Result: PASS

### 7. The Dark Knight

- IMDb ID: `tt0468569`
- TMDb ID: `155`
- Poster count from fanart.tv: `50`
- Poster: https://assets.fanart.tv/fanart/the-dark-knight-551465d577af5.jpg
- Title: The Dark Knight
- Genre: action film / crime film / crime thriller film / drama film / neo-noir / superhero film / thriller film
- Release date: 2008-07-18
- Director: Christopher Nolan
- Result: PASS

### 8. La La Land

- IMDb ID: `tt3783958`
- TMDb ID: `313369`
- Poster count from fanart.tv: `24`
- Poster: https://assets.fanart.tv/fanart/la-la-land-5831aea494153.jpg
- Title: La La Land
- Genre: comedy drama / comedy film / dance film / drama film / musical film / romance film
- Release date: 2016-08-31
- Director: Damien Chazelle
- Result: PASS

### 9. Mad Max: Fury Road

- IMDb ID: `tt1392190`
- TMDb ID: `76341`
- Poster count from fanart.tv: `47`
- Poster: https://assets.fanart.tv/fanart/mad-max-fury-road-55dbd00d0685b.jpg
- Title: Mad Max: Fury Road
- Genre: action film / adventure film / dystopian film / post-apocalyptic film / science fiction film
- Release date: 2015-05-13
- Director: George Miller
- Result: PASS

### 10. Arrival

- IMDb ID: `tt2543164`
- TMDb ID: `329865`
- Poster count from fanart.tv: `33`
- Poster: https://assets.fanart.tv/fanart/arrival-58926ee109e95.jpg
- Title: Arrival
- Genre: drama film / mystery film / science fiction film / thriller film
- Release date: 2016-11-10
- Director: Denis Villeneuve
- Result: PASS
