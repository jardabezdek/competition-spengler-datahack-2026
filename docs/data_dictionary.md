# Team stats data dictionary

Source: `data/processed/team_stats.csv`, built by `make transform` from the raw events export.
Each row is one stat for one slice of the match. `game_id` is the match, the same value as in `game_flow.csv`. `period` is `all` for the whole game, or `1`, `2`, or `3`. `home` and `away` are the two teams. Percentages are calculated inside that slice.

| stat_id | label | description |
|---|---|---|
| SOG | Shots on Goal | Shots by the team that were saved by the goalie or scored. Missed and blocked shots are not counted. |
| XG | Expected Goals | Sum of the expected-goal value (xG) of all of the team's shot attempts, including missed and blocked shots. Higher means better scoring chances. |
| FOW | Faceoffs Won | Number of faceoffs the team won. |
| FO% | Faceoff Percentage | Share of the faceoffs in this slice that the team won. |
| PP | Power Plays | Number of power-play opportunities the team had, i.e. times the opponent was short-handed. An opportunity is counted in the period where it starts. |
| PP% | Powerplay Percentage | Power-play goals in this slice divided by power-play opportunities in this slice. |
| PIM | Penalty Minutes | Minutes the team was penalized for: 2 minutes for each penalty, including bench penalties such as delay of game. |
| BKS | Blocked Shots | Number of the opponent's shots that this team blocked. |
| GV | Giveaways | Unforced losses of the puck: intercepted passes and intercepted clears. |
| TK | Takeaways | Contested puck battles the team wins after the opponent had the puck. |
| CZE | Controlled Entries | Crossings of the offensive blueline toward the opponent while keeping the puck. Dump-ins are not counted. |
| CZX | Controlled Exits | Crossings of the team's own blueline toward the opponent while keeping the puck. |
| SOGA | Shots Against | Shots on goal the team's goalie faced. Empty-net shots are not counted. |
| SV | Saves | Shots on goal that the team's goalie stopped. |
| SV% | Save Percentage | Saves divided by shots against. |
| XGA | Expected Goals Against | Sum of the expected-goal value of the shots on goal the team's goalie faced. |
| GSAx | Saves Above Expected | Expected goals against minus the goals the goalie allowed. Positive means the goalie stopped more than the shot quality suggested. |
