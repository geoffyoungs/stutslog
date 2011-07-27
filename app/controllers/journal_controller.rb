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
			@entries = JournalEntry.where(:date.lt => entryDate).order([[:date, Mongo::DESCENDING]]).limit((params[:limit]||1).to_i).all()
			if @entries.empty?
				render  :content_type => 'application/javascript', :text => '', :layout => false
			end
		elsif range = params['date-range']
			# from is the last seen date in the journal
			# to is the desired date
			from,to = range.split(/:/)
			@entries = JournalEntry.where(:date.lt => from, :date.gte => to).order([[:date, Mongo::DESCENDING]]).all()
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
			render :text => 'IGNORE'
			return
		end
		entry ||= JournalEntry.new(conditions)
		entry.entry = params[:entry].to_s.strip
		entry.save
		render :text => 'OK'
	end
end
