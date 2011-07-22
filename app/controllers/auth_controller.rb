require 'digest/md5'

class AuthController < ApplicationController
	def login
		user = User.find(:name => params[:user])
		if Digest::MD5.hexdigest("foobar-secret-salt-01231231231213:#{params[:password]}") == user.password_hash
			# ok
			session[:user] = user.name
			redirect_to :view
		else
			flash[:warning] = "Unknown user"
		end
	end

	def logout
		session.reset
	end
end
