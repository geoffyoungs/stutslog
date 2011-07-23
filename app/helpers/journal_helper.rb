module JournalHelper
def j(args)
	raw(args.to_json)
end
def highlight_excerpts(text, phrases, options = {})
	options ||= {}
	options[:radix] ||= 8

	output = h(text)
	phrases.each_with_index do |phr, i|
		# up to 3 replacements for each phrase
		count = 0
		output = output.gsub(/(#{Regexp.quote(phr)})/i) do |str|
			if count < 3
				"<strong class=\"highlight-#{(i % 5)+1}\">#{str}</strong>"
			else
				str
			end
		end
	end

	r = options[:radix]
	output.gsub!(/\A[^<>]+([^<>]{#{r}}[<]s)/, '... \1')
	output.gsub!(/([>][^<>]{#{r}})[^<>]{#{r},}([^<>]{#{r}}[<]s)/, '\1 ... \2')
	output.gsub!(/([>][^<>]{#{r}})[^<>]+\z/, '\1 ...')

	raw(output)
end
end
