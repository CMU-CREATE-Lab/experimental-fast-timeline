publish:
	rsync -av --exclude .git/ . tm1:web/eft
