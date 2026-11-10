# Team stats data dictionary

Source: `data/processed/team_stats.csv`, built by `make transform` from the raw events export.
Each row is one stat for one period of the match. `game_id` is the match, the same value as in `game_flow.csv`. `period` is `all` for the whole game, or `1`, `2`, or `3`. `home` and `away` are the two teams.

| stat_id | label | description |
|---|---|---|
| SOG | Shots on Goal | Shots by the team that were saved by the goalie or scored. Missed and blocked shots are not counted. |
| XG | Expected Goals | Sum of the expected-goal value (xG) of all of the team's shot attempts, including missed and blocked shots. Higher means better scoring chances. |
| GAx | Goals Scored Above Expected | Goals scored minus expected goals. Positive means the team scored more than the shot quality suggested. |
| FOW | Faceoffs Won | Number of faceoffs the team won. |
| FO% | Faceoff Percentage | Share of the faceoffs that the team won. |
| PP | Power Plays | Number of power-play opportunities the team had, i.e. times the opponent was short-handed. An opportunity is counted in the period where it starts. |
| PP% | Powerplay Percentage | Power-play goals divided by power-play opportunities. |
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

# Player stats data dictionary

Source: `data/processed/player_stats.csv`, built by `make transform` from the raw events export, the raw aggregates export and `data/reference/20251231_uscs_hcd_players.csv`, a hand-made roster copied from the official lineup with the columns `game_id`, `team_name`, `player_id`, `first_name`, `last_name`, `number` and `position`.
Each row is one player of the match, for the whole game. `game_id` is the match, the same value as in the other files. `player_id` is the player's ID from the event export, or the player's name if the player has no ID (dressed players who did not play, such as backup goalies).
Skater stats are empty for goalies, and goalie stats are empty for skaters.

| column | label | description |
|---|---|---|
| team_name | Team | Name of the player's team. |
| player_name | Player | First and last name. |
| number | Jersey | Jersey number. |
| position | Position | `F` forward, `D` defenseman, `G` goalie. |
| toi | Time on Ice | Time on ice as MM:SS. For skaters it comes from the aggregates export. For goalies it is the time the goalie was in net, measured from the events. |
| shifts | Shifts | Number of shifts. From the aggregates export. |
| goals | Goals | Goals scored. |
| assists | Assists | First and second assists. |
| points | Points | Goals plus assists. |
| plus_minus | Plus/Minus | Goals for minus goals against while the player was on the ice, from the aggregates export. Power-play goals are not counted. |
| pim | Penalty Minutes | 2 minutes for each penalty the player took. Bench penalties are not charged to a player, so a team's players can add up to less than the team's PIM. |
| shots | Shot Attempts | All shots the player took: on goal, missed and blocked. |
| shots_on_goal | Shots on Goal | Shots the player took that were saved or scored. |
| xg | Expected Goals | Sum of the expected-goal value (xG) of all of the player's shot attempts. |
| blocked_shots | Blocked Shots | Opponent shots the player blocked. From the aggregates export, as the events do not record the blocker. |
| faceoff_pct | Faceoff Percentage | Share of the player's faceoffs that the player won. Forwards only, and empty if the forward took no faceoffs. From the aggregates export, as the events do not record the faceoff loser. |
| takeaways | Takeaways | Contested puck battles the player's team wins after the opponent had the puck, credited to the player who comes out with the puck. A takeaway is not credited when the event data does not name a player of the winning team. |
| giveaways | Giveaways | The player's passes and clears that were intercepted. |
| controlled_entries | Controlled Entries | Crossings of the offensive blueline toward the opponent with the player keeping the puck. |
| controlled_exits | Controlled Exits | Crossings of the team's own blueline toward the opponent with the player keeping the puck. |
| shots_against | Shots Against | Shots on goal the goalie faced. |
| saves | Saves | Shots on goal the goalie stopped. |
| goals_against | Goals Against | Goals the goalie allowed. Empty-net goals are not counted. |
| xg_against | Expected Goals Against | Sum of the expected-goal value of the shots on goal the goalie faced. |
| saves_above_expected | Saves Above Expected | Expected goals against minus goals against. Positive means the goalie stopped more than the shot quality suggested. |
| save_pct | Save Percentage | Saves divided by shots against. Empty if the goalie faced no shots. |
