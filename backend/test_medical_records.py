import requests

cookie = {
    "session": ".eJxFy80KwyAQBOBXKXvW4l-weuoj9NB72JilCFGDMafSd-9CD4U5fTPzhnmnXrBSHRBHP0kAvgiinQSsbYEIOgQlleaAACqYN8YdR-bLfdAxrqkVrioW_sGT5fL41ay9bfTfM5wH9TmvbIYmcn4xkrxH6YJVEo1XUt-SDSpZp62FzxfwfTBG.aEAu6w.1skLtZK7t88TkmOnLHyFgrGtroc"
}

# Get the patient ID from the session
response = requests.get(
    "http://127.0.0.1:5001/api/medical-history/2e5e47b2-e77a-4930-a270-18c390c34133",
    cookies=cookie
)

print(response.status_code)
print(response.text) 