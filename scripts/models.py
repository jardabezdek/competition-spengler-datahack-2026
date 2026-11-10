"""Values shared by the event export and the processed feeds."""

from enum import StrEnum

MINOR_PENALTY_MINUTES = 2
PERIOD_SECONDS = 1200


class Side(StrEnum):
    HOME = "home"
    AWAY = "away"


class Position(StrEnum):
    FORWARD = "F"
    DEFENSE = "D"
    GOALIE = "G"


class Team(StrEnum):
    HOME = "Home"
    AWAY = "Away"

    @property
    def side(self) -> Side:
        return Side[self.name]


class PlayType(StrEnum):
    GOAL = "goal"
    PENALTY = "penalty"


class EventType(StrEnum):
    FACEOFF = "Faceoff"
    PASS = "Pass"
    CLEAR = "Clear"
    SHOT = "Shot"
    GOAL = "Goal"
    PENALTY = "Penalty"
    BLUELINE_CROSSING = "BluelineCrossing"
    DUMP = "Dump"
    PUCK_CONTROL = "PuckControl"
    STOPPAGE = "StoppageOfPlay"

    @property
    def play_type(self) -> PlayType:
        return PlayType[self.name]


class GameState(StrEnum):
    FULL_STRENGTH = "fs"
    POWER_PLAY = "pp"
    PENALTY_KILL = "pk"


class Strength(StrEnum):
    HOME_POWERPLAY = "HomePowerplay"
    AWAY_POWERPLAY = "AwayPowerplay"


class ShotResult(StrEnum):
    SAVED = "Saved"
    GOAL = "Goal"
    BLOCKED = "Blocked"


class PassResult(StrEnum):
    INTERCEPTED = "Intercepted"


class CrossingDirection(StrEnum):
    TOWARDS_OPPONENT = "TowardsOpponent"


class CrossingResult(StrEnum):
    POSSESSION_MAINTAINED = "PossessionMaintained"


class PuckState(StrEnum):
    HOME = "HomeControl"
    AWAY = "AwayControl"
    CONTESTED = "Contested"


class ClearType(StrEnum):
    INTERCEPTED = "Intercepted"


class TeamStat(StrEnum):
    SHOTS_ON_GOAL = "SOG"
    EXPECTED_GOALS = "XG"
    GOALS_ABOVE_EXPECTED = "GAx"
    FACEOFF_WINS = "FOW"
    FACEOFF_PERCENTAGE = "FO%"
    POWER_PLAYS = "PP"
    POWER_PLAY_PERCENTAGE = "PP%"
    PENALTY_MINUTES = "PIM"
    BLOCKED_SHOTS = "BKS"
    GIVEAWAYS = "GV"
    TAKEAWAYS = "TK"
    CONTROLLED_ENTRIES = "CZE"
    CONTROLLED_EXITS = "CZX"
    SHOTS_AGAINST = "SOGA"
    SAVES = "SV"
    SAVE_PERCENTAGE = "SV%"
    EXPECTED_GOALS_AGAINST = "XGA"
    SAVES_ABOVE_EXPECTED = "GSAx"
