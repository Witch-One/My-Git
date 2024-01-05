import { useCallback, useEffect, useMemo, useState } from 'react'
interface DirRes {
  dirName: string
  fileNames: string[]
}

function isImageFormat(fileName): boolean {
  // 定义一个正则表达式，匹配常见的图片格式
  const imageFormats = /\.(jpg|jpeg|png|bmp|webp)$/i

  // 使用test方法检查文件名是否匹配正则表达式
  return imageFormats.test(fileName)
}

function App(): JSX.Element {
  const [picList, setPicList] = useState<string[]>([])
  const [currentRandomTime, setCurrentRandomTime] = useState(300)
  const [randomTime, setRandomTime] = useState(300)

  const [countDownTime, setCountDownTime] = useState(0)

  const handleSelectDir = async (): Promise<void> => {
    const res: DirRes = await window.electron.ipcRenderer.invoke('select-dir')
    console.log(res)
    setPicList(
      res.fileNames
        .filter((file) => isImageFormat(file))
        .map((picName) => {
          return `${res.dirName}/${picName}`
        })
    )
  }

  const formatCountDown = useMemo(() => {
    // 格式化时间（countDownTime是秒）
    console.log(countDownTime)
    const hour = Math.floor(countDownTime / 3600)
    const minutes = Math.floor((countDownTime - hour * 3600) / 60)
    const seconds = countDownTime % 60
    return `倒计时：${hour}小时${minutes}分${seconds.toString().padStart(2, '0')}秒`
  }, [countDownTime])

  const [isRandomMod, setIsRandomMod] = useState(
    JSON.parse(localStorage.getItem('isRandomMod') || 'false') || false
  )

  const handleSetIsRandomMod = (val: boolean): void => {
    localStorage.setItem('isRandomMod', JSON.stringify(val))
    setIsRandomMod(val)
  }

  const getRandomIndex = (): number => {
    return Math.floor(Math.random() * picList.length)
  }

  const [picIndex, setPicIndex] = useState(0)

  const [currentBase64, setCurrentBase64] = useState('')

  const getCurrentPic = useCallback(async (): Promise<void> => {
    if (!picList[picIndex]) return

    const res = await window.electron.ipcRenderer.invoke('create-from-path', picList[picIndex])
    setCurrentBase64(res)
  }, [picList, picIndex])

  useEffect(() => {
    getCurrentPic()
  }, [getCurrentPic])

  useEffect(() => {
    setCountDownTime(randomTime)
    const timeout = setTimeout(() => {
      const curIndex = isRandomMod
        ? getRandomIndex()
        : picIndex < picList.length - 1
          ? picIndex + 1
          : 0

      setPicIndex(curIndex)
      setCountDownTime(randomTime)
    }, randomTime * 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [randomTime, picIndex, picList.length, isRandomMod])

  useEffect(() => {
    const countDownTimeout = setTimeout(() => {
      setCountDownTime(countDownTime - 1)
    }, 1000)

    return () => {
      clearTimeout(countDownTimeout)
    }
  }, [countDownTime])

  return (
    <div
      className="container"
      style={{
        maxHeight: '100vh'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '10vh'
        }}
      >
        <div onClick={handleSelectDir}>select</div>
        <div>
          随机模式
          <input
            type="checkbox"
            name="随机模式"
            id=""
            value={isRandomMod}
            onChange={(e) => {
              handleSetIsRandomMod(e.target.checked)
            }}
          />
        </div>
        <div>
          下一张时间
          <input
            type="number"
            name="随机时间"
            id=""
            value={currentRandomTime}
            onChange={(e) => {
              setCurrentRandomTime(e.target.valueAsNumber)
            }}
            onBlur={() => {
              if (currentRandomTime >= 10) setRandomTime(currentRandomTime)
              else setCurrentRandomTime(randomTime)
            }}
          />
        </div>
        <div>{formatCountDown}</div>
      </header>
      <div
        style={{
          flex: '1',
          overflow: 'hidden'
        }}
      >
        <img
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover'
          }}
          src={currentBase64}
          alt="Base64 Encoded Image"
          referrerPolicy="origin"
        />
      </div>
    </div>
  )
}

export default App
