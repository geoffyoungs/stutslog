require 'ferret_tokenizer'
require 'text'

class JournalEntry
	include Mongoid::Document

	field :user, :type => String
	field :date, :type => Date
	field :entry, :type => String
	field :keywords, :type => Array
	field :time_references, :type => Array

	index [[:user, Mongo::ASCENDING], [:date, Mongo::ASCENDING]], :unique => true
	index :keywords

	def entry_text
		Nokogiri.HTML(self.entry.to_s.gsub(/[>]/, '> ')).text()
	end

	before_save :update_keywords
	protected
	def update_keywords
		self.keywords = JournalEntry.text_to_tokens(entry_text)
	end
	def self.text_to_tokens(text)
		t = FerretTokenizer.new(text.downcase)
		tokens = []
		while token = t.next; tokens << token; end
		tokens.map { |token| Text::PorterStemming.stem(token) }.uniq
	end
end

