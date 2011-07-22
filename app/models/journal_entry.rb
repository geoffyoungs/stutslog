class JournalEntry
	include Mongoid::Document

	field :user, :type => String
	field :date, :type => Date
	field :entry, :type => String

	index [[:user, Mongo::ASCENDING], [:date, Mongo::ASCENDING]], :unique => true
#	include MongoMapper::Document

#	key :id, String
#	key :user, String
#	key :date, Time
#	
#	key :entry, String
end

#JournalEntry.ensure_index([[:user, 1], [:date, 1]])
