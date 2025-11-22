from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    #Connect to the page
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://www.instagram.com/perritos_encontrados_santiago/")
    next = ""
    cont = 1
    input("start")
    while next=="":
        ph=0
        print("Cargando perrito "+str(cont))
        elementos = page.query_selector_all('[aria-label="Siguiente"]')
        while len(elementos)>2:
            elems = page.query_selector_all('[role="presentation"]')
            elems[2].screenshot(path=f"imgs/perro_{cont}/foto_{ph}.png")
            ph+=1
            elementos[2].click()
            #wait for the image to load
            page.wait_for_timeout(1000)
            elementos = page.query_selector_all('[aria-label="Siguiente"]')

        elems = page.query_selector_all('[role="presentation"]')
        elems[2].screenshot(path=f"imgs/perro_{cont}/foto_{ph}.png")
        elementos[1].click()
        page.wait_for_timeout(1000)
        cont+=1
    browser.close()
#+56954203378
#cachulo1
#https://www.instagram.com/perritos_encontrados_santiago/