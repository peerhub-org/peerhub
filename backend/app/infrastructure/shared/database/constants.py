from pymongo.collation import Collation

# Case-insensitive collation for username queries
CASE_INSENSITIVE = Collation(locale="en", strength=2)
