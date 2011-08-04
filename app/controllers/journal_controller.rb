require 'date2'
class Date
	def weekend?
		[0,6].include?(self.wday)
	end
end
class JournalController < ApplicationController
	before_filter :authenticate_user!

	def view
		@entries = []
		i = 1
		until @entries.size == 10
			date = Date.today - i
			journal = JournalEntry.first(:conditions => { :date => date, :user => current_user.email })
			journal ||= JournalEntry.new(:date => date.to_time, :user => current_user.email)
			@entries << journal
			i += 1
		end
		@today = JournalEntry.find_or_create_by(:user => current_user.email, :date => Date.today)
	end

	def load
		if entryDate = params['before-date']
			@entries = JournalEntry.where(:date.lt => entryDate).order([[:date, Mongo::DESCENDING]]).limit((params[:limit]||1).to_i)
		elsif range = params['date-range']
			# from is the last seen date in the journal
			# to is the desired date
			from,to = range.split(/:/)
			@entries = JournalEntry.where(:date.lt => from, :date.gte => to).order([[:date, Mongo::DESCENDING]])
		end
	end

	def search
		tokens = JournalEntry.text_to_tokens(params[:q])
		@entries = JournalEntry.all_in(:keywords => tokens).order_by([[:date, :desc]])

		render :layout => false
	end

	def update
		conditions = { :user => current_user.email, :date => params[:date] }
		entry = JournalEntry.first(:conditions => conditions)
		if entry.nil? && params[:entry].strip.empty?
			render :text => {'result' => 'noop'}.to_json, :type => 'application/json'
			return
		end
		if entry && entry.revision.to_i > params[:revision].to_i
			render :text => {'result' => 'fail', 'reason' => "Revision mismatch - #{entry.revision} > #{params[:revision]}"}.to_json, :type => 'application/json'
			return
		end
		entry ||= JournalEntry.new(conditions)
		entry.entry = params[:entry].to_s.strip
		entry.save
		render :text => {'result' => 'save', 'revision' => entry.revision}.to_json, :type => 'application/json'
	end
end
