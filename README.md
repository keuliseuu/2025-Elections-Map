# 2025 Philippine Senatorial Election Interactive Map
An interactive election results map with drill-down navigation, vote counts, and candidate choropleth visualizations.

This is a personal project where I visualized partial and unofficial senatorial election results for the Philippines on an interactive map.

 Live demo: [www.eleksyon2025map.com](http://www.eleksyon2025map.com)
 
![](eleksyon2025map_demo.gif)

## Features

- Map drill-down navigation from **Region → Province → City/Municipality → Barangay**
- Displays vote counts for each candidate
- Candidate choropleth maps to visualize vote distribution by area

## Built with:
<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet.js-199900?logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/QGIS-589632?logo=qgis&logoColor=white" />
</p>

Election return data was scraped from the [COMELEC website](https://2025electionresults.comelec.gov.ph/er-result) and stored in a PostgreSQL database. The interactive map is built with Leaflet.js. QGIS was used to update administrative boundaries. The project runs on a VPS with a Node.js backend serving map and election results data.

## Acknowledgements

- Election data from the [COMELEC website](https://2025electionresults.comelec.gov.ph/er-result)  
- Shapefiles from [James Faeldon](https://github.com/altcoder/philippines-psgc-shapefiles)  

