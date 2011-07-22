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
		dates = params[:dates].split(/,/)
	end

	def search
		params[:q]
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
